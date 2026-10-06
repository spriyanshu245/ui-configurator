import { db } from '../client';

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
};
