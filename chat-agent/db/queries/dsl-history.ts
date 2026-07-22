import { db } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface DslHistoryEntry {
  id: string;
  micrositeId: string;
  pagePath: string;
  dslSnapshot: object;
  operation: 'patch_applied' | 'rollback' | 'initial_load';
  patchApplied?: object[] | null;
  description: string;
  approvedBy: string;
  sessionId?: string;
  wasEdited?: boolean;
  createdAt: string;
}

export const dslHistory = {
  saveSnapshot: async (entry: Omit<DslHistoryEntry, 'id' | 'createdAt' | 'dslSnapshot' | 'patchApplied'> & { dslSnapshot: object, patchApplied?: object[] | null }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const col = db.collection('dsl_history');
    await col.insertOne({
      id,
      micrositeId: entry.micrositeId,
      pagePath: entry.pagePath,
      dslSnapshot: entry.dslSnapshot,
      operation: entry.operation,
      patchApplied: entry.patchApplied || null,
      description: entry.description,
      approvedBy: entry.approvedBy,
      sessionId: entry.sessionId,
      wasEdited: entry.wasEdited ?? false,
      createdAt: now
    });

    // Prune to keep only the last 3 entries for this (micrositeId, pagePath) combination
    const toDelete = await col.find(
      { micrositeId: entry.micrositeId, pagePath: entry.pagePath },
      { sort: { createdAt: -1 }, skip: 3, projection: { _id: 1 } }
    ).toArray();

    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map(doc => doc._id);
      await col.deleteMany({ _id: { $in: idsToDelete } });
    }

    return id;
  },

  /**
   * Fetch a single history entry by id, scoped to (micrositeId, pagePath) so a
   * historyId can't be replayed against the wrong page/microsite.
   */
  getEntry: async (historyId: string, micrositeId: string, pagePath: string) => {
    const col = db.collection('dsl_history');
    const row = await col.findOne({ id: historyId, micrositeId, pagePath });
    if (!row) return null;
    return {
      id: row.id,
      micrositeId: row.micrositeId,
      pagePath: row.pagePath,
      dslSnapshot: row.dslSnapshot,
      operation: row.operation,
      patchApplied: row.patchApplied,
      description: row.description,
      approvedBy: row.approvedBy,
      sessionId: row.sessionId,
      wasEdited: row.wasEdited,
      createdAt: row.createdAt,
    } as DslHistoryEntry;
  },

  getHistory: async (micrositeId: string, pagePath: string, limit: number = 3) => {
    const col = db.collection('dsl_history');
    const rows = await col.find(
      { micrositeId, pagePath },
      { sort: { createdAt: -1 }, limit }
    ).toArray();

    return rows.map(row => ({
      id: row.id,
      micrositeId: row.micrositeId,
      pagePath: row.pagePath,
      dslSnapshot: row.dslSnapshot,
      operation: row.operation,
      patchApplied: row.patchApplied,
      description: row.description,
      approvedBy: row.approvedBy,
      sessionId: row.sessionId,
      wasEdited: row.wasEdited,
      createdAt: row.createdAt
    })) as DslHistoryEntry[];
  },

  /**
   * Same lookup as getHistory but omits dslSnapshot, which can be large.
   * Use this when only summary metadata is needed (e.g. listing history for the UI/tools).
   */
  getHistorySummaries: async (micrositeId: string, pagePath: string, limit: number = 3) => {
    const col = db.collection('dsl_history');
    const rows = await col.find(
      { micrositeId, pagePath },
      { sort: { createdAt: -1 }, limit, projection: { dslSnapshot: 0 } }
    ).toArray();

    return rows.map(row => ({
      id: row.id,
      micrositeId: row.micrositeId,
      pagePath: row.pagePath,
      operation: row.operation,
      patchApplied: row.patchApplied,
      description: row.description,
      approvedBy: row.approvedBy,
      sessionId: row.sessionId,
      wasEdited: row.wasEdited,
      createdAt: row.createdAt
    })) as Omit<DslHistoryEntry, 'dslSnapshot'>[];
  }
};

export const sessionOps = {
  saveMessage: async (userId: string, micrositeId: string, msg: any) => {
    const col = db.collection('conversations');
    await col.updateOne(
      { userId, micrositeId },
      { 
        $push: { messages: { $each: [msg], $slice: -30 } } as any,
        $set: { updatedAt: new Date().toISOString() }
      },
      { upsert: true }
    );
  },
  getHistory: async (userId: string, micrositeId: string) => {
    const col = db.collection('conversations');
    const doc = await col.findOne({ userId, micrositeId });
    if (!doc || !doc.messages) return [];
    
    const messages = doc.messages;
    const len = messages.length;
    return messages.map((m: any, i: number) => {
      if (i < len - 20 && m.role) {
        return { role: m.role, content: m.content || "" };
      }
      return m;
    });
  },
  appendOp: async (userId: string, micrositeId: string, pagePath: string, op: any) => {
    const col = db.collection('page_ops');
    op.ts = new Date().toISOString();
    await col.updateOne(
      { userId, micrositeId, pagePath },
      { $push: { ops: { $each: [op], $slice: -10 } } as any },
      { upsert: true }
    );
  },
  saveTask: async (userId: string, micrositeId: string, taskContext: any) => {
    const col = db.collection('conversations');
    await col.updateOne(
      { userId, micrositeId },
      { 
        $set: { taskContext, updatedAt: new Date().toISOString() }
      },
      { upsert: true }
    );
  }
};
