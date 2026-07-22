import { NextResponse } from 'next/server';
import { db } from '../../../../../chat-agent/db/client';
import { sessionOps } from '../../../../../chat-agent/db/queries/dsl-history';
import { sessionsOps } from '../../../../../chat-agent/db/queries/sessions';
import { getUserId } from '../../../../../chat-agent/lib/getUserId';
import { logger } from '../../../../../chat-agent/lib/logger';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const micrositeId = url.searchParams.get("micrositeId");
    const clientSessionId = url.searchParams.get("clientSessionId") || undefined;

    if (!micrositeId) {
      return NextResponse.json({ error: "Missing micrositeId" }, { status: 400 });
    }

    const userId = getUserId(req);

    const session = await sessionsOps.resolve(userId, micrositeId, clientSessionId);

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
      sessionId: session.id,
      messages,
      taskContext,
      pageOps
    });
  } catch (error) {
    logger.error("Session restore failed", { error: (error as Error).message });
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
