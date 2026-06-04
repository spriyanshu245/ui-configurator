import { NextResponse } from 'next/server';
import { pendingPatchesDB } from '../../../../../chat-agent/db/queries/pending-patches';

export async function POST(req: Request) {
  try {
    const { patchId, reason } = await req.json();

    const pending = pendingPatchesDB.get(patchId);
    if (!pending) {
      return NextResponse.json({ error: 'Patch not found' }, { status: 404 });
    }

    // Potentially log this to skill entries to learn from the rejection

    pendingPatchesDB.delete(patchId);

    return NextResponse.json({ success: true, message: 'Patch rejected', reason });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
