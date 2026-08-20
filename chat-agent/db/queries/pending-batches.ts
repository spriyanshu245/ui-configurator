import { db } from '../client';

export interface PendingBatchOperation {
  pagePath: string;
  pageVersion: number;
  description: string;
  previewHint?: string;
  affectedComponents?: string[];
  currentDsl: any;
  patchedDsl: any;
  patch: any[];
  status: "pending" | "applied" | "failed" | "rolled_back";
}

export interface PendingBatchDoc {
  id: string;
  sessionId: string;
  micrositeId: string;
  batchDescription: string;
  navigateTo: string | null;
  operations: PendingBatchOperation[];
  proposedAt: string;
  expiresAt: Date | string | null;
  status: "pending" | "applying" | "committed" | "failed";
}

export const pendingBatchesDB = {
  save: async (batch: PendingBatchDoc) => {
    await db.collection('pending_batches').insertOne({
      id: batch.id,
      sessionId: batch.sessionId,
      micrositeId: batch.micrositeId,
      batchDescription: batch.batchDescription,
      navigateTo: batch.navigateTo ?? null,
      operations: batch.operations,
      proposedAt: batch.proposedAt,
      expiresAt: batch.expiresAt || null,
      status: batch.status || "pending",
    });
  },

  get: async (id: string): Promise<PendingBatchDoc | null> => {
    const result = await db.collection('pending_batches').findOne({ id });
    if (!result) return null;
    return {
      id: result.id,
      sessionId: result.sessionId,
      micrositeId: result.micrositeId,
      batchDescription: result.batchDescription,
      navigateTo: result.navigateTo ?? null,
      operations: result.operations,
      proposedAt: result.proposedAt,
      expiresAt: result.expiresAt ?? null,
      status: result.status,
    };
  },

  delete: async (id: string) => {
    await db.collection('pending_batches').deleteOne({ id });
  },

  updateStatus: async (id: string, status: PendingBatchDoc["status"]) => {
    await db.collection('pending_batches').updateOne(
      { id },
      { $set: { status } },
    );
  },

  updateOpStatus: async (
    id: string,
    pagePath: string,
    status: PendingBatchOperation["status"],
  ) => {
    await db.collection('pending_batches').updateOne(
      { id, "operations.pagePath": pagePath },
      { $set: { "operations.$.status": status } },
    );
  },

  /**
   * Find a batch for the given microsite that is currently mid-flight
   * ("applying"), excluding the batch identified by excludeId. Used to enforce
   * the single-writer concurrency lock per microsite in the atomic approve route.
   */
  findApplyingForMicrosite: async (
    micrositeId: string,
    excludeId?: string,
  ): Promise<PendingBatchDoc | null> => {
    const query: Record<string, any> = { micrositeId, status: "applying" };
    if (excludeId) {
      query.id = { $ne: excludeId };
    }
    const result = await db.collection('pending_batches').findOne(query);
    if (!result) return null;
    return {
      id: result.id,
      sessionId: result.sessionId,
      micrositeId: result.micrositeId,
      batchDescription: result.batchDescription,
      navigateTo: result.navigateTo ?? null,
      operations: result.operations,
      proposedAt: result.proposedAt,
      expiresAt: result.expiresAt ?? null,
      status: result.status,
    };
  },
};
