import { db } from '../client';

export const pendingPatchesDB = {
  save: async (patch: any) => {
    await db.collection('pending_patches').insertOne({
      id: patch.id,
      sessionId: patch.sessionId,
      micrositeId: patch.micrositeId,
      pagePath: patch.pagePath,
      patch: patch.patch,
      description: patch.description,
      previewHint: patch.previewHint,
      affectedComponents: patch.affectedComponents,
      currentDsl: patch.currentDsl,
      patchedDsl: patch.patchedDsl,
      proposedAt: patch.proposedAt,
      expiresAt: patch.expiresAt || null
    });
  },

  get: async (id: string) => {
    const result = await db.collection('pending_patches').findOne({ id });
    if (!result) return null;
    return {
      id: result.id,
      sessionId: result.sessionId,
      micrositeId: result.micrositeId,
      pagePath: result.pagePath,
      patch: result.patch,
      description: result.description,
      previewHint: result.previewHint,
      affectedComponents: result.affectedComponents,
      currentDsl: result.currentDsl,
      patchedDsl: result.patchedDsl,
      proposedAt: result.proposedAt
    };
  },

  delete: async (id: string) => {
    await db.collection('pending_patches').deleteOne({ id });
  }
};
