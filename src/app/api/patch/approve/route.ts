import { NextResponse } from "next/server";
import * as jsonpatch from "fast-json-patch";
import { applyPatch } from "../../../../../chat-agent/lib/dsl-patcher";
import { dslHistory, sessionOps } from "../../../../../chat-agent/db/queries/dsl-history";
import { pendingPatchesDB } from "../../../../../chat-agent/db/queries/pending-patches";
import { sessionsOps } from "../../../../../chat-agent/db/queries/sessions";
import { putPageDsl } from "../../../../../chat-agent/lib/backend-sync";
import { getUserId } from "../../../../../chat-agent/lib/getUserId";
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

    const wasEdited = !!editedDsl;
    const patchedDsl = editedDsl || applyPatch(pending.currentDsl, pending.patch);

    // When the user hand-edited the proposed DSL, the patch that was originally
    // proposed no longer reflects what actually got applied. Recompute the real
    // patch from (currentDsl -> patchedDsl) so dsl_history stays truthful.
    const actualPatch = wasEdited
      ? jsonpatch.compare(pending.currentDsl as object, patchedDsl as object)
      : pending.patch;

    const { cookies } = require('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const authHeader = req.headers.get("authorization");
    const userIdHeader = req.headers.get("x-user-id");

    logger.debug("Approval request headers", {
      hasAuthHeader: !!authHeader,
      hasUserIdHeader: !!userIdHeader,
      cookieHeaderLength: cookieHeader?.length ?? 0,
    });

    const userId = getUserId(req);

    await putPageDsl(pending.pagePath, patchedDsl, {
      authHeader,
      cookieHeader,
      userIdHeader,
      version: 1,
    });

    const historyId = await dslHistory.saveSnapshot({
      micrositeId: pending.micrositeId,
      pagePath: pending.pagePath,
      dslSnapshot: pending.currentDsl,
      operation: "patch_applied",
      patchApplied: actualPatch,
      description: pending.description,
      approvedBy: "user",
      sessionId: pending.sessionId,
      wasEdited,
    });

    try {
      await sessionsOps.appendHistoryRef(userId, pending.micrositeId, {
        historyId,
        patchId: pending.id,
        pagePath: pending.pagePath,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      logger.warn("Failed to append session history ref", { error: (e as Error).message });
    }

    try {
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
