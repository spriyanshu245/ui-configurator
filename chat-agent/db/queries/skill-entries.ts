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
  findAll: async (options?: { orderBy?: { category?: 'asc' | 'desc', usageCount?: 'asc' | 'desc' } }) => {
    const col = db.collection('skill_entries');
    let sortObj: any = {};
    if (options?.orderBy) {
      if (options.orderBy.category) sortObj.category = options.orderBy.category === 'asc' ? 1 : -1;
      if (options.orderBy.usageCount) sortObj.usageCount = options.orderBy.usageCount === 'asc' ? 1 : -1;
    }
    const cursor = col.find({});
    if (Object.keys(sortObj).length > 0) {
      cursor.sort(sortObj);
    }
    const rows = await cursor.toArray();
    return rows.map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      content: r.content,
      confidence: r.confidence,
      source: r.source,
      usageCount: r.usageCount,
      embedding: r.embedding,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })) as SkillEntry[];
  },

  upsert: async (entry: Partial<SkillEntry> & { title: string, category: string, content: string, confidence: number, source: string }) => {
    const col = db.collection('skill_entries');
    const existing = await col.findOne({ title: entry.title });
    const now = new Date().toISOString();

    if (existing) {
      await col.updateOne(
        { title: entry.title },
        { 
          $set: { 
            content: entry.content, 
            confidence: entry.confidence, 
            source: entry.source, 
            usageCount: existing.usageCount + 1, 
            updatedAt: now 
          } 
        }
      );
      return existing.id;
    } else {
      const id = entry.id || uuidv4();
      await col.insertOne({
        id,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        confidence: entry.confidence,
        source: entry.source,
        usageCount: entry.usageCount || 0,
        embedding: entry.embedding || null,
        createdAt: now,
        updatedAt: now
      });
      return id;
    }
  },

  countSince: async (date: string) => {
    return await db.collection('skill_entries').countDocuments({ createdAt: { $gt: date } });
  }
};
