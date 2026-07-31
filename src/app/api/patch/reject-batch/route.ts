import { NextResponse } from 'next/server';
import { pendingBatchesDB } from '../../../../../chat-agent/db/queries/pending-batches';
import { sessionOps } from '../../../../../chat-agent/db/queries/dsl-history';
import { getUserId } from '../../../../../chat-agent/lib/getUserId';
import { logger } from '../../../../../chat-agent/lib/logger';

export async function POST(req: Request) {
  try {
    const { batchId, reason } = await req.json();

    const pending = await pendingBatchesDB.get(batchId);
    if (!pending) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const userId = getUserId(req);

    try {
      for (const op of pending.operations) {
        await sessionOps.appendOp(userId, pending.micrositeId, op.pagePath, {
          summary: `Batch rejected: ${reason || "No reason"}`,
          outcome: "rejected",
        });
      }
      await sessionOps.saveTask(userId, pending.micrositeId, {
        intent: "DSL batch modification rejected",
        pendingPatch: false,
      });
    } catch (e) {
      logger.error("Failed to append op for batch rejection", { error: (e as Error).message });
    }

    await pendingBatchesDB.delete(batchId);

    return NextResponse.json({ success: true, message: 'Batch rejected', reason });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
