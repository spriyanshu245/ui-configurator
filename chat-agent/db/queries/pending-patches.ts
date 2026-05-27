import { db } from '../client';

export const pendingPatchesDB = {
  save: (patch: any) => {
    const stmt = db.prepare(`
      INSERT INTO pending_patches (id, sessionId, micrositeId, pagePath, patch, description, previewHint, affectedComponents, currentDsl, patchedDsl, proposedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      patch.id,
      patch.sessionId,
      patch.micrositeId,
      patch.pagePath,
      JSON.stringify(patch.patch),
      patch.description,
      patch.previewHint,
      JSON.stringify(patch.affectedComponents),
      JSON.stringify(patch.currentDsl),
      JSON.stringify(patch.patchedDsl),
      patch.proposedAt
    );
  },

  get: (id: string) => {
    const stmt = db.prepare('SELECT * FROM pending_patches WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    return {
      ...result,
      patch: JSON.parse(result.patch),
      affectedComponents: JSON.parse(result.affectedComponents),
      currentDsl: JSON.parse(result.currentDsl),
      patchedDsl: JSON.parse(result.patchedDsl)
    };
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM pending_patches WHERE id = ?');
    stmt.run(id);
  }
};
