import { NextResponse } from "next/server";
import { pendingBatchesDB } from "../../../../../chat-agent/db/queries/pending-batches";
import { dslHistory, sessionOps } from "../../../../../chat-agent/db/queries/dsl-history";
import { sessionsOps } from "../../../../../chat-agent/db/queries/sessions";
import { putPageDsl } from "../../../../../chat-agent/lib/backend-sync";
import { getUserId } from "../../../../../chat-agent/lib/getUserId";
import { logger } from "../../../../../chat-agent/lib/logger";

interface AppliedEntry {
  pagePath: string;
  preImage: any;
}

export async function POST(req: Request) {
  let batchId: string | undefined;
  try {
    const body = await req.json();
    batchId = body.batchId;
    const toolCallId = body.toolCallId;

    if (!batchId) {
      return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
    }

    const userId = getUserId(req);

    const batch = await pendingBatchesDB.get(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found or already processed" },
        { status: 404 },
      );
    }

    // CONCURRENCY LOCK: another batch already applying against this microsite?
    const otherApplying = await pendingBatchesDB.findApplyingForMicrosite(
      batch.micrositeId,
      batch.id,
    );
    if (otherApplying) {
      return NextResponse.json(
        {
          error:
            "Another batch is currently being applied to this microsite, please wait",
        },
        { status: 409 },
      );
    }

    await pendingBatchesDB.updateStatus(batchId, "applying");

    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const authHeader = req.headers.get("authorization");
    const userIdHeader = req.headers.get("x-user-id");

    logger.debug("Batch approval request headers", {
      hasAuthHeader: !!authHeader,
      hasUserIdHeader: !!userIdHeader,
      cookieHeaderLength: cookieHeader?.length ?? 0,
    });

    const applied: AppliedEntry[] = [];
    let forwardError: Error | null = null;

    // FORWARD loop: apply every page's patched DSL in order.
    for (const op of batch.operations) {
      try {
        await putPageDsl(op.pagePath, op.patchedDsl, {
          authHeader,
          cookieHeader,
          userIdHeader,
          version: 1,
        });
        await pendingBatchesDB.updateOpStatus(batchId, op.pagePath, "applied");
        applied.push({ pagePath: op.pagePath, preImage: op.currentDsl });
      } catch (err) {
        await pendingBatchesDB.updateOpStatus(batchId, op.pagePath, "failed");
        forwardError = err as Error;
        break;
      }
    }

    if (forwardError) {
      // COMPENSATION: revert every page that was already applied, in reverse order.
      const compensationErrors: { pagePath: string; error: string }[] = [];

      for (const entry of [...applied].reverse()) {
        try {
          await putPageDsl(entry.pagePath, entry.preImage, {
            authHeader,
            cookieHeader,
            userIdHeader,
            version: 1,
          });
          await pendingBatchesDB.updateOpStatus(
            batchId,
            entry.pagePath,
            "rolled_back",
          );
        } catch (ce) {
          compensationErrors.push({
            pagePath: entry.pagePath,
            error: (ce as Error).message,
          });
          logger.error("Compensation failed for page", {
            pagePath: entry.pagePath,
            error: (ce as Error).message,
          });
          // DO NOT abort — continue compensating the rest.
        }
      }

      await pendingBatchesDB.updateStatus(batchId, "failed");
      // DO NOT delete the pending batch — keep it for audit.

      const appliedThenRolledBack = applied.map((a) => a.pagePath);

      let errorMessage = `Batch failed while applying page "${
        applied.length < batch.operations.length
          ? batch.operations[applied.length].pagePath
          : "unknown"
      }": ${forwardError.message}`;

      if (compensationErrors.length > 0) {
        const pages = compensationErrors.map((c) => c.pagePath).join(", ");
        errorMessage = `Batch failed AND compensation failed on page(s): ${pages} — manual verification required. Original error: ${forwardError.message}`;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          compensationErrors,
          appliedThenRolledBack,
        },
        { status: 500 },
      );
    }

    // All forward operations succeeded — record history + commit.
    const appliedPages: string[] = [];
    for (const op of batch.operations) {
      const historyId = await dslHistory.saveSnapshot({
        micrositeId: batch.micrositeId,
        pagePath: op.pagePath,
        dslSnapshot: op.currentDsl,
        operation: "patch_applied",
        patchApplied: op.patch,
        description: op.description,
        approvedBy: "user",
        sessionId: batch.sessionId,
      });

      try {
        await sessionsOps.appendHistoryRef(userId, batch.micrositeId, {
          historyId,
          patchId: batch.id,
          pagePath: op.pagePath,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        logger.warn("Failed to append session history ref for batch op", {
          error: (e as Error).message,
        });
      }

      appliedPages.push(op.pagePath);
    }

    try {
      await sessionOps.saveTask(userId, batch.micrositeId, {
        intent: "DSL batch modification approved",
        pendingPatch: false,
      });

      if (toolCallId) {
        const toolMsg = {
          role: "tool",
          tool_call_id: toolCallId,
          name: "propose_dsl_batch",
          content: JSON.stringify({
            success: true,
            message: "Batch applied successfully",
          }),
        };
        const assistantMsg = {
          role: "assistant",
          content:
            "DSL batch approved and saved successfully! I've updated all affected pages. You can reload the preview to see the changes.",
        };
        await sessionOps.saveMessage(userId, batch.micrositeId, toolMsg);
        await sessionOps.saveMessage(userId, batch.micrositeId, assistantMsg);
      }
    } catch (e) {
      logger.warn("Failed to append messages for batch approval", {
        error: (e as Error).message,
      });
    }

    await pendingBatchesDB.updateStatus(batchId, "committed");
    await pendingBatchesDB.delete(batchId);

    return NextResponse.json({
      success: true,
      batchId,
      appliedPages,
      navigateTo: batch.navigateTo,
    });
  } catch (error) {
    logger.error("Batch approval failed", { error: (error as Error).message });
    if (batchId) {
      try {
        await pendingBatchesDB.updateStatus(batchId, "failed");
      } catch (e) {
        logger.warn("Failed to mark batch as failed after error", {
          error: (e as Error).message,
        });
      }
    }
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
