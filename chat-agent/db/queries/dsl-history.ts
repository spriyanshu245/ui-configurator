import { db } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface DslHistoryEntry {
  id: string;
  micrositeId: string;
  pagePath: string;
  dslSnapshot: object;
  operation: 'patch_applied' | 'rollback' | 'initial_load';
  patchApplied?: object[];
  description: string;
  approvedBy: string;
  createdAt: string;
}

export const dslHistory = {
  saveSnapshot: (entry: Omit<DslHistoryEntry, 'id' | 'createdAt' | 'dslSnapshot' | 'patchApplied'> & { dslSnapshot: object, patchApplied?: object[] }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO dsl_history (id, micrositeId, pagePath, dslSnapshot, operation, patchApplied, description, approvedBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entry.micrositeId,
      entry.pagePath,
      JSON.stringify(entry.dslSnapshot),
      entry.operation,
      entry.patchApplied ? JSON.stringify(entry.patchApplied) : null,
      entry.description,
      entry.approvedBy,
      now
    );

    // Prune to keep only the last 3 entries for this (micrositeId, pagePath) combination
    const pruneStmt = db.prepare(`
      DELETE FROM dsl_history
      WHERE id NOT IN (
        SELECT id FROM dsl_history
        WHERE micrositeId = ? AND pagePath = ?
        ORDER BY createdAt DESC
        LIMIT 3
      )
      AND micrositeId = ? AND pagePath = ?
    `);
    pruneStmt.run(entry.micrositeId, entry.pagePath, entry.micrositeId, entry.pagePath);

    return id;
  },

  getHistory: (micrositeId: string, pagePath: string, limit: number = 3) => {
    const stmt = db.prepare(`
      SELECT * FROM dsl_history
      WHERE micrositeId = ? AND pagePath = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `);

    const rows = stmt.all(micrositeId, pagePath, limit) as any[];
    return rows.map(row => ({
      ...row,
      dslSnapshot: JSON.parse(row.dslSnapshot),
      patchApplied: row.patchApplied ? JSON.parse(row.patchApplied) : undefined
    })) as DslHistoryEntry[];
  }
};
