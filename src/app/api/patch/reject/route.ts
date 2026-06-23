import { NextResponse } from 'next/server';
import { pendingPatchesDB } from '../../../../../chat-agent/db/queries/pending-patches';

export async function POST(req: Request) {
  try {
    const { patchId, reason } = await req.json();

    const pending = await pendingPatchesDB.get(patchId);
    if (!pending) {
      return NextResponse.json({ error: 'Patch not found' }, { status: 404 });
    }

    // Potentially log this to skill entries to learn from the rejection

    const authHeader = req.headers.get("authorization");
    let userId = req.headers.get("x-user-id") || "anonymous";
    if (!userId || userId === "anonymous") {
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const tokenPart = authHeader.split(" ")[1];
          const payloadBase64 = tokenPart.split(".")[1];
          const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
          const payloadJson = atob(base64);
          const payload = JSON.parse(payloadJson);
          if (payload.preferred_username) {
            userId = payload.preferred_username.replace(/\D/g, "");
          }
        } catch (e) {
        }
      }
    }

    try {
      const { sessionOps } = require("../../../../../chat-agent/db/queries/dsl-history");
      await sessionOps.appendOp(userId, pending.micrositeId, pending.pagePath, {
        summary: `Patch rejected: ${reason || "No reason"}`,
        outcome: "rejected"
      });
      await sessionOps.saveTask(userId, pending.micrositeId, { intent: "DSL modification rejected", pendingPatch: false });
    } catch (e) {
      console.error("Failed to append op for rejection", e);
    }

    await pendingPatchesDB.delete(patchId);

    return NextResponse.json({ success: true, message: 'Patch rejected', reason });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
