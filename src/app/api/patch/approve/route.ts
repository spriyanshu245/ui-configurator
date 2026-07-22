import { NextResponse } from "next/server";
import { applyPatch } from "../../../../../chat-agent/lib/dsl-patcher";
import { dslHistory } from "../../../../../chat-agent/db/queries/dsl-history";
import { pendingPatchesDB } from "../../../../../chat-agent/db/queries/pending-patches";
import { getApiBaseUrl } from "../../../utils/utils";
import { logger } from "../../../../../chat-agent/lib/logger";

export async function POST(req: Request) {
  try {
    const { patchId, editedDsl, toolCallId } = await req.json();

    const pending = await pendingPatchesDB.get(patchId);
    if (!pending) {
      return NextResponse.json(
        { error: "Patch not found or already processed" },
        { status: 404 },
      );
    }

    const patchedDsl = editedDsl || applyPatch(pending.currentDsl, pending.patch);

    const { cookies } = require('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const authHeader = req.headers.get("authorization");
    let userIdHeader = req.headers.get("x-user-id");

    logger.debug("Approval request headers", {
      hasAuthHeader: !!authHeader,
      hasUserIdHeader: !!userIdHeader,
      cookieHeaderLength: cookieHeader?.length ?? 0,
    });

    if (!userIdHeader && authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const tokenPart = authHeader.split(" ")[1];
        const payloadBase64 = tokenPart.split(".")[1];
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const payloadJson = atob(base64);
        const payload = JSON.parse(payloadJson);
        if (payload.preferred_username) {
          userIdHeader = payload.preferred_username.replace(/\D/g, "");
          logger.debug("Extracted userId from JWT");
        }
      } catch (e) {
        logger.warn("Failed to decode JWT", { error: (e as Error).message });
      }
    }

    const API_URL = getApiBaseUrl();
    logger.debug("Backend API resolution", { baseUrl: API_URL });
    const putUrl = `${API_URL}/api/v1/config/pages/${pending.pagePath}?version=1`;
    logger.debug("Submitting patch to backend", {
      url: putUrl,
      patchSize: JSON.stringify(patchedDsl).length,
    });

    const putResponse = await fetch(
      putUrl,
      {
        method: "PUT",
        headers: {
          accept: "*/*",
          "content-type": "application/json",
          "workspace-code": "engineering-workspace",
          "x-user-type": "employee",
          Cookie: cookieHeader,
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(userIdHeader ? { "x-user-id": userIdHeader } : {}),
        },
        body: JSON.stringify(patchedDsl),
      },
    );

    if (!putResponse.ok) {
      const errorText = await putResponse.text().catch(() => "");
      logger.error("PUT request failed", {
        status: putResponse.status,
        statusText: putResponse.statusText,
      });
      throw new Error(
        `Failed to apply patch to backend API (Status: ${putResponse.status} ${putResponse.statusText}): ${errorText}`,
      );
    }

    // Immediately re-fetch and cache the latest DSL state
    try {
      const getResponse = await fetch(putUrl, {
        method: "GET",
        headers: {
          accept: "*/*",
          "content-type": "application/json",
          "workspace-code": "engineering-workspace",
          "x-user-type": "employee",
          Cookie: cookieHeader,
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(userIdHeader ? { "x-user-id": userIdHeader } : {}),
        }
      });
      if (getResponse.ok) {
        const latestDsl = await getResponse.json();
        const { updateDslCache } = require("../../../../../chat-agent/lib/dsl-patcher");
        updateDslCache(pending.pagePath, latestDsl);
        logger.info("Updated in-memory DSL cache", { pagePath: pending.pagePath });
      }
    } catch (e) {
      logger.warn("Failed to fetch latest DSL after PUT", { error: (e as Error).message });
    }

    await dslHistory.saveSnapshot({
      micrositeId: pending.micrositeId,
      pagePath: pending.pagePath,
      dslSnapshot: pending.currentDsl,
      operation: "patch_applied",
      patchApplied: pending.patch,
      description: pending.description,
      approvedBy: "user",
    });

    try {
      const { sessionOps } = require("../../../../../chat-agent/db/queries/dsl-history");
      const userId = userIdHeader || "anonymous";
      await sessionOps.appendOp(userId, pending.micrositeId, pending.pagePath, {
        summary: "Patch approved and applied",
        outcome: "success"
      });
      // Clear pendingPatch state
      await sessionOps.saveTask(userId, pending.micrositeId, { intent: "DSL modification approved", pendingPatch: false });

      if (toolCallId) {
        const toolMsg = {
          role: "tool",
          tool_call_id: toolCallId,
          name: "propose_dsl_patch",
          content: JSON.stringify({ success: true, message: "Patch applied successfully" }),
        };
        const assistantMsg = {
          role: "assistant",
          content: "DSL patch approved and saved successfully! I've updated the page. You can reload the preview to see the changes.",
        };
        await sessionOps.saveMessage(userId, pending.micrositeId, toolMsg);
        await sessionOps.saveMessage(userId, pending.micrositeId, assistantMsg);
      }
    } catch (e) {
      logger.warn("Failed to append op for approval", { error: (e as Error).message });
    }

    await pendingPatchesDB.delete(patchId);

    return NextResponse.json({
      success: true,
      patchId,
      message: "Patch applied successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
