import { NextResponse } from 'next/server';
import { db } from '../../../../../chat-agent/db/client';
import { sessionOps } from '../../../../../chat-agent/db/queries/dsl-history';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const micrositeId = url.searchParams.get("micrositeId");
    
    if (!micrositeId) {
      return NextResponse.json({ error: "Missing micrositeId" }, { status: 400 });
    }

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
        } catch (e) {}
      }
    }

    // Get messages and taskContext
    const messages = await sessionOps.getHistory(userId, micrositeId);
    
    const conversationsCol = db.collection('conversations');
    const conversation = await conversationsCol.findOne({ userId, micrositeId });
    const taskContext = conversation?.taskContext || {};

    // Get pageOps
    const pageOpsCol = db.collection('page_ops');
    const opsDocs = await pageOpsCol.find({ userId, micrositeId }).toArray();
    
    const pageOps: Record<string, any[]> = {};
    for (const doc of opsDocs) {
      if (doc.pagePath) {
        pageOps[doc.pagePath] = doc.ops || [];
      }
    }

    return NextResponse.json({
      messages,
      taskContext,
      pageOps
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
