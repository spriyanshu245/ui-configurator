import { db } from './client';

/**
 * Creates all required indexes across the 9 Mongo collections used by chat-agent.
 * Idempotent: every index has an explicit `name`, so re-running createIndex with the
 * same name/spec is a no-op (and Mongo will error loudly if the spec changed under
 * the same name, which is the desired fail-fast behavior).
 */
export async function ensureIndexes(): Promise<void> {
  await Promise.all([
    // NEVER add expireAfterSeconds here — dsl_history is the revert source of truth;
    // pruning is by-count only.
    db.collection('dsl_history').createIndex(
      { micrositeId: 1, pagePath: 1, createdAt: -1 },
      { name: 'dsl_history_lookup' }
    ),

    db.collection('conversations').createIndex(
      { userId: 1, micrositeId: 1 },
      { name: 'conversations_lookup', unique: true }
    ),

    db.collection('page_ops').createIndex(
      { userId: 1, micrositeId: 1, pagePath: 1 },
      { name: 'page_ops_lookup', unique: true }
    ),

    db.collection('pending_patches').createIndex(
      { id: 1 },
      { name: 'pending_patches_id', unique: true }
    ),
    db.collection('pending_patches').createIndex(
      { expiresAt: 1 },
      { name: 'pending_patches_ttl', expireAfterSeconds: 0 }
    ),

    // sparse:true so existing docs without mergeKey don't break the unique build.
    // NOTE: mergeKey is not yet populated by skill-entries.ts logic — that's Workstream D's job.
    db.collection('skill_entries').createIndex(
      { mergeKey: 1 },
      { name: 'skill_entries_mergekey', unique: true, sparse: true }
    ),
    db.collection('skill_entries').createIndex(
      { category: 1, confidence: -1, usageCount: -1 },
      { name: 'skill_entries_compile_order' }
    ),

    // Not unique — Workstream C will rescope this to per-user later.
    db.collection('user_preferences').createIndex(
      { key: 1 },
      { name: 'user_preferences_key' }
    ),

    db.collection('temp_dsl').createIndex(
      { toolCallId: 1 },
      { name: 'temp_dsl_lookup', unique: true }
    ),
    db.collection('temp_dsl').createIndex(
      { createdAt: 1 },
      { name: 'temp_dsl_ttl', expireAfterSeconds: 3600 }
    ),

    db.collection('tool_call_log').createIndex(
      { sessionId: 1, createdAt: -1 },
      { name: 'tool_call_log_lookup' }
    ),
  ]);

  // Defensive startup assertion: guard against manual TTL mistakes on dsl_history,
  // which must never expire since it is the revert source of truth.
  const dslHistoryIndexes = await db.collection('dsl_history').listIndexes().toArray();
  const offendingIndex = dslHistoryIndexes.find(
    (idx) => typeof idx.expireAfterSeconds === 'number'
  );
  if (offendingIndex) {
    throw new Error(
      `dsl_history index "${offendingIndex.name}" has expireAfterSeconds set. ` +
      `dsl_history must never have a TTL index — it is the revert source of truth.`
    );
  }
}
