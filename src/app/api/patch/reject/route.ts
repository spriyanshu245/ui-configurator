import { NextResponse } from 'next/server';
import { pendingPatchesDB } from '../../../../../chat-agent/db/queries/pending-patches';
import { sessionOps } from '../../../../../chat-agent/db/queries/dsl-history';
import { getUserId } from '../../../../../chat-agent/lib/getUserId';
import { logger } from '../../../../../chat-agent/lib/logger';

export async function POST(req: Request) {
  try {
    const { patchId, reason } = await req.json();

    const pending = await pendingPatchesDB.get(patchId);
    if (!pending) {
      return NextResponse.json({ error: 'Patch not found' }, { status: 404 });
    }

    // Potentially log this to skill entries to learn from the rejection

    const userId = getUserId(req);

    try {
      await sessionOps.appendOp(userId, pending.micrositeId, pending.pagePath, {
        summary: `Patch rejected: ${reason || "No reason"}`,
        outcome: "rejected"
      });
      await sessionOps.saveTask(userId, pending.micrositeId, { intent: "DSL modification rejected", pendingPatch: false });
    } catch (e) {
      logger.error("Failed to append op for rejection", { error: (e as Error).message });
    }

    await pendingPatchesDB.delete(patchId);

    return NextResponse.json({ success: true, message: 'Patch rejected', reason });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
