import { db } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface SkillEntry {
  id: string;
  category: 'component_pattern' | 'user_preference' | 'dsl_rule' | 'common_operation' | 'error_fix' | 'routing_pattern';
  title: string;
  content: string;
  confidence: number;
  source: 'agent_reflection' | 'user_correction' | 'seed' | 'auto';
  usageCount: number;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export const skillEntries = {
  findAll: (options?: { orderBy?: { category?: 'asc' | 'desc', usageCount?: 'asc' | 'desc' } }) => {
    let query = 'SELECT * FROM skill_entries';
    if (options?.orderBy) {
      const orderClauses = [];
      if (options.orderBy.category) orderClauses.push(`category ${options.orderBy.category.toUpperCase()}`);
      if (options.orderBy.usageCount) orderClauses.push(`usageCount ${options.orderBy.usageCount.toUpperCase()}`);
      if (orderClauses.length > 0) {
        query += ` ORDER BY ${orderClauses.join(', ')}`;
      }
    }
    const stmt = db.prepare(query);
    return stmt.all() as SkillEntry[];
  },

  upsert: (entry: Partial<SkillEntry> & { title: string, category: string, content: string, confidence: number, source: string }) => {
    const existing = db.prepare('SELECT id, usageCount FROM skill_entries WHERE title = ?').get(entry.title) as { id: string, usageCount: number } | undefined;
    const now = new Date().toISOString();

    if (existing) {
      const stmt = db.prepare(`
        UPDATE skill_entries
        SET content = ?, confidence = ?, source = ?, usageCount = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(entry.content, entry.confidence, entry.source, existing.usageCount + 1, now, existing.id);
      return existing.id;
    } else {
      const id = entry.id || uuidv4();
      const stmt = db.prepare(`
        INSERT INTO skill_entries (id, category, title, content, confidence, source, usageCount, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, entry.category, entry.title, entry.content, entry.confidence, entry.source, entry.usageCount || 0, now, now);
      return id;
    }
  },

  countSince: (date: string) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM skill_entries WHERE createdAt > ?');
    const result = stmt.get(date) as { count: number };
    return result.count;
  }
};
