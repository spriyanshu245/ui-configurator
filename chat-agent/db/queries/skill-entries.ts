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
  mergeKey: string;
  sourcePatchId?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Build the dedupe key a skill entry upserts against: `${category}::${slugified title}`.
 * Lowercases, strips punctuation, collapses whitespace to single hyphens.
 */
export function buildMergeKey(category: string, title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${category}::${slug}`;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const tok of a) {
    if (b.has(tok)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Whole-content Jaccard similarity over sentence-token sets (average of the two directions' best matches). */
function contentSimilarity(existingContent: string, newContent: string): number {
  const existingTokens = new Set(existingContent.toLowerCase().match(/[a-z0-9${}]+/g) ?? []);
  const newTokens = new Set(newContent.toLowerCase().match(/[a-z0-9${}]+/g) ?? []);
  return jaccard(existingTokens, newTokens);
}

/**
 * Deterministic (no-LLM) content merge used by upsert:
 * - If the new content is > 0.6 Jaccard-similar to the existing content, treat it
 *   as a duplicate/restatement and keep the existing content unchanged.
 * - Otherwise, append the new content as an additional paragraph, capping the
 *   total to ~5 sentences (dropping the oldest sentences first).
 */
export function mergeContent(existingContent: string | undefined, newContent: string): string {
  if (!existingContent || !existingContent.trim()) return newContent;

  if (contentSimilarity(existingContent, newContent) > 0.6) {
    return existingContent;
  }

  const combined = `${existingContent}\n\n${newContent}`;
  const sentences = combined
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const MAX_SENTENCES = 5;
  if (sentences.length <= MAX_SENTENCES) {
    return combined;
  }

  // Truncate the oldest sentences first, keep the most recent MAX_SENTENCES.
  return sentences.slice(sentences.length - MAX_SENTENCES).join(' ');
}

export const skillEntries = {
  findAll: async (options?: { orderBy?: { category?: 'asc' | 'desc', usageCount?: 'asc' | 'desc' } }) => {
    const col = db.collection('skill_entries');
    // Default to the skill_entries_compile_order index shape
    // ({category:1, confidence:-1, usageCount:-1}) so compilation is
    // deterministic and index-backed even when no explicit orderBy is given.
    let sortObj: any = { category: 1, confidence: -1, usageCount: -1 };
    if (options?.orderBy) {
      sortObj = {};
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
      mergeKey: r.mergeKey,
      sourcePatchId: r.sourcePatchId,
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })) as SkillEntry[];
  },

  /**
   * Atomic upsert keyed on `mergeKey` (= `${category}::${slugify(title)}`), via
   * a single findOneAndUpdate — no find-then-write race. Content is merged
   * deterministically (see mergeContent), confidence takes the max of the new
   * and existing values, and usageCount is intentionally NOT touched here
   * (usage is tracked separately via markUsed, bumped only when an entry is
   * actually rendered into the compiled skill file).
   */
  upsert: async (entry: Partial<SkillEntry> & { title: string, category: string, content: string, confidence: number, source: string }) => {
    const col = db.collection('skill_entries');
    const now = new Date().toISOString();
    const mergeKey = entry.mergeKey || buildMergeKey(entry.category, entry.title);

    const existing = await col.findOne({ mergeKey });
    const mergedContent = mergeContent(existing?.content, entry.content);
    const mergedConfidence = Math.max(entry.confidence, existing?.confidence ?? 0);

    const result = await col.findOneAndUpdate(
      { mergeKey },
      {
        $set: {
          title: entry.title,
          content: mergedContent,
          confidence: mergedConfidence,
          source: entry.source,
          ...(entry.sourcePatchId ? { sourcePatchId: entry.sourcePatchId } : {}),
          updatedAt: now,
        },
        $setOnInsert: {
          id: entry.id || uuidv4(),
          category: entry.category,
          mergeKey,
          usageCount: 0,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    // Some driver typings return {value, ok}, others return the doc directly.
    const doc: any = (result as any)?.value !== undefined ? (result as any).value : result;
    return doc?.id;
  },

  /** Increment usageCount and stamp lastUsedAt for the given entry ids (e.g. after they were rendered into the compiled skill file). */
  markUsed: async (ids: string[]): Promise<void> => {
    if (!ids || ids.length === 0) return;
    const col = db.collection('skill_entries');
    await col.updateMany(
      { id: { $in: ids } },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date().toISOString() },
      },
    );
  },

  /**
   * Keep the skill_entries collection bounded and healthy:
   *  (a) decay confidence (*=0.95, floor 0.05) for entries not updated in 30+ days,
   *  (b) if the collection exceeds maxEntries, evict the lowest-scored entries
   *      (confidence asc, usageCount asc, updatedAt asc) — but NEVER evict
   *      source:"seed" entries, which are permanent.
   */
  enforceBounds: async (maxEntries: number = 150): Promise<void> => {
    const col = db.collection('skill_entries');
    const now = Date.now();
    const cutoffIso = new Date(now - THIRTY_DAYS_MS).toISOString();

    // (a) Confidence decay for stale entries.
    const staleEntries = await col
      .find({ updatedAt: { $lt: cutoffIso } })
      .toArray();

    for (const entry of staleEntries) {
      const decayed = Math.max(0.05, (entry.confidence ?? 0) * 0.95);
      await col.updateOne({ id: entry.id }, { $set: { confidence: decayed } });
    }

    // (b) Bound total count, never evicting seeds.
    const total = await col.countDocuments({});
    if (total > maxEntries) {
      const overflow = total - maxEntries;
      const evictionCandidates = await col
        .find({ source: { $ne: 'seed' } })
        .sort({ confidence: 1, usageCount: 1, updatedAt: 1 })
        .limit(overflow)
        .toArray();

      const idsToEvict = evictionCandidates.map((e) => e.id);
      if (idsToEvict.length > 0) {
        await col.deleteMany({ id: { $in: idsToEvict } });
      }
    }
  },

  countSince: async (date: string) => {
    return await db.collection('skill_entries').countDocuments({ createdAt: { $gt: date } });
  }
};
