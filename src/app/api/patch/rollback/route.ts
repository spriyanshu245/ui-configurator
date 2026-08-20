import { NextResponse } from "next/server";
import { dslHistory, sessionOps } from "../../../../../chat-agent/db/queries/dsl-history";
import { validateAndAssignIds } from "../../../../../chat-agent/lib/dsl-patcher";
import { putPageDsl } from "../../../../../chat-agent/lib/backend-sync";
import { fetchMicrositePages } from "../../../../../chat-agent/lib/microsite-loader";
import { getUserId } from "../../../../../chat-agent/lib/getUserId";
import { logger } from "../../../../../chat-agent/lib/logger";
import { getApiBaseUrl } from "../../../utils/utils";

export async function POST(req: Request) {
  try {
    const { micrositeId, pagePath, historyId } = await req.json();

    if (!micrositeId || !pagePath || !historyId) {
      return NextResponse.json(
        { error: "Missing required fields: micrositeId, pagePath, historyId" },
        { status: 400 },
      );
    }

    const userId = getUserId(req);

    const target = await dslHistory.getEntry(historyId, micrositeId, pagePath);
    if (!target) {
      return NextResponse.json(
        { error: "Snapshot no longer available (older than last 3 changes)" },
        { status: 404 },
      );
    }

    let revertDsl: any;
    try {
      revertDsl = structuredClone(target.dslSnapshot);
      validateAndAssignIds(revertDsl);
    } catch (e) {
      return NextResponse.json(
        { error: `Snapshot failed validation: ${(e as Error).message}` },
        { status: 400 },
      );
    }

    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const authHeader = req.headers.get("authorization");
    const userIdHeader = req.headers.get("x-user-id");

    // Resolve the page's REAL backend version so the GET/PUT hit the right
    // version slot (not a hardcoded 1).
    let pageVersion = 1;
    try {
      const micrositeData = await fetchMicrositePages(micrositeId);
      const page = micrositeData?.pages?.find(
        (p: any) => p.pageCode === pagePath,
      );
      if (page?.pageVersion) pageVersion = page.pageVersion;
    } catch (e) {
      logger.warn("Failed to resolve page version for rollback; defaulting to 1", {
        error: (e as Error).message,
      });
    }

    // Fetch the CURRENT dsl first, so the rollback's own pre-image (the state
    // being reverted FROM) is what gets recorded in history — not the target snapshot.
    let currentDslBeforeRollback: any = null;
    try {
      const getUrl = `${getApiBaseUrl()}/api/v1/config/pages/${pagePath}?version=${pageVersion}`;
      const getResponse = await fetch(getUrl, {
        method: "GET",
        headers: {
          accept: "*/*",
          "content-type": "application/json",
          "workspace-code": "engineering-workspace",
          "x-user-type": "employee",
          Cookie: cookieHeader,
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(userIdHeader ? { "x-user-id": userIdHeader } : {}),
        },
      });
      if (getResponse.ok) {
        currentDslBeforeRollback = await getResponse.json();
      }
    } catch (e) {
      logger.warn("Failed to fetch current DSL before rollback", { error: (e as Error).message });
    }

    await putPageDsl(pagePath, revertDsl, {
      authHeader,
      cookieHeader,
      userIdHeader,
      userId,
      version: pageVersion,
    });

    const historyEntryId = await dslHistory.saveSnapshot({
      micrositeId,
      pagePath,
      dslSnapshot: currentDslBeforeRollback || target.dslSnapshot,
      operation: "rollback",
      patchApplied: null,
      description: `Reverted to snapshot from ${target.createdAt}`,
      approvedBy: "user",
      sessionId: target.sessionId,
    });

    try {
      await sessionOps.appendOp(userId, micrositeId, pagePath, {
        summary: "Rolled back",
        outcome: "success",
      });
    } catch (e) {
      logger.warn("Failed to append op for rollback", { error: (e as Error).message });
    }

    return NextResponse.json({ success: true, historyId: historyEntryId });
  } catch (error) {
    logger.error("Rollback failed", { error: (error as Error).message });
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
