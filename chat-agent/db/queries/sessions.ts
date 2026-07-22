import { db } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface SessionHistoryRef {
  historyId: string;
  patchId: string;
  pagePath: string;
  createdAt: string;
}

export interface SessionDoc {
  id: string;
  userId: string;
  micrositeId: string;
  activePageCode: string | null;
  clientSessionIds: string[];
  taskContext: Record<string, any>;
  historyRefs: SessionHistoryRef[];
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export const sessionsOps = {
  /**
   * Resolve (and lazily create) the canonical session for (userId, micrositeId).
   * Uses findOneAndUpdate with upsert so concurrent requests never race into a
   * duplicate-key error against the unique {userId, micrositeId} index.
   */
  resolve: async (
    userId: string,
    micrositeId: string,
    clientSessionId?: string,
  ): Promise<SessionDoc> => {
    const col = db.collection('sessions');
    const now = new Date().toISOString();

    const update: Record<string, any> = {
      $setOnInsert: {
        id: uuidv4(),
        userId,
        micrositeId,
        activePageCode: null,
        createdAt: now,
        historyRefs: [],
        taskContext: {},
      },
      $set: {
        updatedAt: now,
        lastActiveAt: now,
      },
    };

    if (clientSessionId) {
      update.$addToSet = { clientSessionIds: clientSessionId };
    }

    const result = await col.findOneAndUpdate(
      { userId, micrositeId },
      update,
      { upsert: true, returnDocument: 'after' },
    );

    // Some driver typings return {value, ok} others return the doc directly.
    const doc: any = (result as any)?.value !== undefined ? (result as any).value : result;

    // Enforce the -10 slice on clientSessionIds without racing $addToSet and $push
    // in the same update (Mongo disallows both on the same field in one call).
    if (clientSessionId && doc?.clientSessionIds?.length > 10) {
      await col.updateOne(
        { userId, micrositeId },
        { $push: { clientSessionIds: { $each: [], $slice: -10 } } as any },
      );
      doc.clientSessionIds = doc.clientSessionIds.slice(-10);
    }

    return {
      id: doc.id,
      userId: doc.userId,
      micrositeId: doc.micrositeId,
      activePageCode: doc.activePageCode ?? null,
      clientSessionIds: doc.clientSessionIds ?? [],
      taskContext: doc.taskContext ?? {},
      historyRefs: doc.historyRefs ?? [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastActiveAt: doc.lastActiveAt,
    } as SessionDoc;
  },

  appendHistoryRef: async (
    userId: string,
    micrositeId: string,
    ref: SessionHistoryRef,
  ): Promise<void> => {
    const col = db.collection('sessions');
    await col.updateOne(
      { userId, micrositeId },
      {
        $push: { historyRefs: { $each: [ref], $slice: -20 } } as any,
        $set: { updatedAt: new Date().toISOString() },
      },
      { upsert: true },
    );
  },

  setActivePage: async (
    userId: string,
    micrositeId: string,
    activePageCode: string | null,
  ): Promise<void> => {
    const col = db.collection('sessions');
    await col.updateOne(
      { userId, micrositeId },
      { $set: { activePageCode, updatedAt: new Date().toISOString() } },
      { upsert: true },
    );
  },
};
