import { db } from './client';
import { logger } from '../lib/logger';

/**
 * Creates all required indexes across the 9 Mongo collections used by chat-agent.
 * Idempotent: every index has an explicit `name`, so re-running createIndex with the
 * same name/spec is a no-op (and Mongo will error loudly if the spec changed under
 * the same name, which is the desired fail-fast behavior).
 */
export async function ensureIndexes(): Promise<void> {
  const specs: Array<{ name: string; build: () => Promise<string> }> = [
    // NEVER add expireAfterSeconds here — dsl_history is the revert source of truth;
    // pruning is by-count only.
    {
      name: 'dsl_history_lookup',
      build: () =>
        db.collection('dsl_history').createIndex(
          { micrositeId: 1, pagePath: 1, createdAt: -1 },
          { name: 'dsl_history_lookup' }
        ),
    },

    {
      name: 'conversations_lookup',
      build: () =>
        db.collection('conversations').createIndex(
          { userId: 1, micrositeId: 1 },
          { name: 'conversations_lookup', unique: true }
        ),
    },

    // Backs sessionsOps.resolve's findOneAndUpdate upsert — must be unique so
    // concurrent requests for the same (userId, micrositeId) never race into dupes.
    {
      name: 'sessions_lookup',
      build: () =>
        db.collection('sessions').createIndex(
          { userId: 1, micrositeId: 1 },
          { name: 'sessions_lookup', unique: true }
        ),
    },

    {
      name: 'page_ops_lookup',
      build: () =>
        db.collection('page_ops').createIndex(
          { userId: 1, micrositeId: 1, pagePath: 1 },
          { name: 'page_ops_lookup', unique: true }
        ),
    },

    {
      name: 'pending_patches_id',
      build: () =>
        db.collection('pending_patches').createIndex(
          { id: 1 },
          { name: 'pending_patches_id', unique: true }
        ),
    },
    {
      name: 'pending_patches_ttl',
      build: () =>
        db.collection('pending_patches').createIndex(
          { expiresAt: 1 },
          { name: 'pending_patches_ttl', expireAfterSeconds: 0 }
        ),
    },

    {
      name: 'pending_batches_id',
      build: () =>
        db.collection('pending_batches').createIndex(
          { id: 1 },
          { name: 'pending_batches_id', unique: true }
        ),
    },
    {
      name: 'pending_batches_ttl',
      build: () =>
        db.collection('pending_batches').createIndex(
          { expiresAt: 1 },
          { name: 'pending_batches_ttl', expireAfterSeconds: 0 }
        ),
    },
    // Backs the concurrent-lock check in the atomic batch-approve route: find any
    // other batch for this microsite that is currently mid-flight ("applying").
    {
      name: 'pending_batches_microsite_status',
      build: () =>
        db.collection('pending_batches').createIndex(
          { micrositeId: 1, status: 1 },
          { name: 'pending_batches_microsite_status' }
        ),
    },

    // sparse:true so existing docs without mergeKey don't break the unique build.
    {
      name: 'skill_entries_mergekey',
      build: () =>
        db.collection('skill_entries').createIndex(
          { mergeKey: 1 },
          { name: 'skill_entries_mergekey', unique: true, sparse: true }
        ),
    },
    {
      name: 'skill_entries_compile_order',
      build: () =>
        db.collection('skill_entries').createIndex(
          { category: 1, confidence: -1, usageCount: -1 },
          { name: 'skill_entries_compile_order' }
        ),
    },

    // Compound unique per (userId, micrositeId, key) — rescoped from the former
    // global-only {key:1} index as part of per-user preferences (Workstream C).
    {
      name: 'user_preferences_key',
      build: () =>
        db.collection('user_preferences').createIndex(
          { userId: 1, micrositeId: 1, key: 1 },
          { name: 'user_preferences_key', unique: true }
        ),
    },

    {
      name: 'temp_dsl_lookup',
      build: () =>
        db.collection('temp_dsl').createIndex(
          { toolCallId: 1 },
          { name: 'temp_dsl_lookup', unique: true }
        ),
    },
    {
      name: 'temp_dsl_ttl',
      build: () =>
        db.collection('temp_dsl').createIndex(
          { createdAt: 1 },
          { name: 'temp_dsl_ttl', expireAfterSeconds: 900 }
        ),
    },
  ];

  const results = await Promise.allSettled(specs.map((s) => s.build()));
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      logger.warn('Failed to ensure MongoDB index', {
        index: specs[i].name,
        error: (result.reason as Error)?.message ?? String(result.reason),
      });
    }
  });

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
