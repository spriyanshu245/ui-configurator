import { NextResponse } from "next/server";
import { applyPatch } from "../../../../../chat-agent/lib/dsl-patcher";
import { dslHistory } from "../../../../../chat-agent/db/queries/dsl-history";
import { pendingPatchesDB } from "../../../../../chat-agent/db/queries/pending-patches";
import { getApiBaseUrl } from "../../../utils/utils";
import * as fs from "fs";
import * as path from "path";

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), "chat-agent.log");
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] [APPROVE-ROUTE] ${msg}\n`);
  } catch (e) {}
}

export async function POST(req: Request) {
  try {
    const { patchId, editedDsl } = await req.json();

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

    logToFile(`Incoming authorization header: ${authHeader}`);
    logToFile(`Incoming x-user-id header: ${userIdHeader}`);
    logToFile(`Incoming Cookie header length: ${cookieHeader?.length ?? 0}`);

    if (!userIdHeader && authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const tokenPart = authHeader.split(" ")[1];
        const payloadBase64 = tokenPart.split(".")[1];
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const payloadJson = atob(base64);
        const payload = JSON.parse(payloadJson);
        logToFile(`Decoded Token preferred_username: ${payload.preferred_username}`);
        if (payload.preferred_username) {
          userIdHeader = payload.preferred_username.replace(/\D/g, "");
          logToFile(`Extracted userId: ${userIdHeader}`);
        }
      } catch (e) {
        logToFile(`Failed to decode JWT: ${(e as Error).message}`);
      }
    }

    const API_URL = getApiBaseUrl();
    logToFile(`Resolving backend API URL: ${API_URL}`);
    const putUrl = `${API_URL}/api/v1/config/pages/${pending.pagePath}?version=1`;
    logToFile(`Submitting PUT to: ${putUrl}`);
    logToFile(`PUT request body: ${JSON.stringify(patchedDsl).substring(0, 500)}...`);

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
      logToFile(`PUT response status: ${putResponse.status}, body: ${errorText}`);
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
        logToFile(`Successfully updated in-memory DSL cache for ${pending.pagePath}`);
      }
    } catch (e) {
      logToFile(`Warning: Failed to fetch latest DSL after PUT: ${(e as Error).message}`);
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
    } catch (e) {
      logToFile(`Failed to append op for approval: ${e}`);
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
