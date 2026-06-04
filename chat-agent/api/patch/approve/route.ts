import { NextResponse } from 'next/server';
import { applyPatch } from '../../../lib/dsl-patcher';
import { dslHistory } from '../../../db/queries/dsl-history';
import { pendingPatchesDB } from '../../../db/queries/pending-patches';

export async function POST(req: Request) {
  try {
    const { patchId } = await req.json();

    const pending = pendingPatchesDB.get(patchId);
    if (!pending) {
      return NextResponse.json({ error: 'Patch not found or already processed' }, { status: 404 });
    }

    // Save snapshot before applying
    dslHistory.saveSnapshot({
      micrositeId: pending.micrositeId,
      pagePath: pending.pagePath,
      dslSnapshot: pending.currentDsl,
      operation: 'patch_applied',
      patchApplied: pending.patch,
      description: pending.description,
      approvedBy: 'user' // Defaulting to user
    });

    const { cookies } = require('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.dev.rahi.cloud';
    const putResponse = await fetch(`${API_URL}/api/v1/config/pages/${pending.pagePath}`, {
      method: "PUT",
      headers: {
        "accept": "*/*",
        "content-type": "application/json",
        "workspace-code": "engineering-workspace",
        "x-user-type": "employee",
        "Cookie": cookieHeader
      },
      body: JSON.stringify(pending.patchedDsl)
    });

    if (!putResponse.ok) {
      throw new Error(`Failed to apply patch to backend API: ${putResponse.statusText}`);
    }

    pendingPatchesDB.delete(patchId);

    // Fire off async reflection update (stubbed)
    // runSkillReflection({...});

    return NextResponse.json({ success: true, message: 'Patch applied successfully' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
