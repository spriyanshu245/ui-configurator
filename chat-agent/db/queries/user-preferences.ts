import { db } from '../client';
import { logger } from '../../lib/logger';

export interface UserPreference {
  userId: string;
  micrositeId: string;
  key: string;
  value: string;
  updatedAt: string;
}

export const GLOBAL_SCOPE = '__global__';

export const userPreferences = {
  findAll: async (userId: string, micrositeId: string) => {
    const rows = await db
      .collection('user_preferences')
      .find({
        $or: [
          { userId, micrositeId },
          { userId: GLOBAL_SCOPE },
        ],
      })
      .toArray();
    return rows.map(r => ({
      userId: r.userId,
      micrositeId: r.micrositeId,
      key: r.key,
      value: r.value,
      updatedAt: r.updatedAt
    })) as UserPreference[];
  },

  set: async (userId: string, micrositeId: string, key: string, value: string) => {
    const now = new Date().toISOString();
    await db.collection('user_preferences').updateOne(
      { userId, micrositeId, key },
      { $set: { value, updatedAt: now } },
      { upsert: true }
    );
  },

  get: async (userId: string, micrositeId: string, key: string) => {
    const result = await db.collection('user_preferences').findOne({ userId, micrositeId, key });
    if (!result) return undefined;
    return {
      userId: result.userId,
      micrositeId: result.micrositeId,
      key: result.key,
      value: result.value,
      updatedAt: result.updatedAt
    } as UserPreference;
  },

  /**
   * Migrate legacy global preference rows (docs saved before per-user scoping,
   * which have no `userId` field) to {userId: "__global__", micrositeId: "__global__"}.
   * Idempotent: rows that already carry a userId are left untouched, and once a
   * row has been migrated it will no longer match the `{userId: {$exists: false}}`
   * filter, so re-running this is a no-op.
   */
  migrateGlobalPrefs: async (): Promise<{ migrated: number }> => {
    const col = db.collection('user_preferences');
    const legacyRows = await col
      .find({ userId: { $exists: false } })
      .toArray();

    if (legacyRows.length === 0) {
      return { migrated: 0 };
    }

    let migrated = 0;
    for (const row of legacyRows) {
      try {
        await col.updateOne(
          { _id: row._id },
          {
            $set: {
              userId: GLOBAL_SCOPE,
              micrositeId: GLOBAL_SCOPE,
            },
          },
        );
        migrated += 1;
      } catch (e) {
        logger.error('Failed to migrate legacy preference row', {
          key: row.key,
          error: (e as Error).message,
        });
      }
    }

    return { migrated };
  },
};
