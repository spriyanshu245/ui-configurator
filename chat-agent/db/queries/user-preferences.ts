import { db } from '../client';

export interface UserPreference {
  key: string;
  value: string;
  updatedAt: string;
}

export const userPreferences = {
  findAll: async () => {
    const rows = await db.collection('user_preferences').find({}).toArray();
    return rows.map(r => ({
      key: r.key,
      value: r.value,
      updatedAt: r.updatedAt
    })) as UserPreference[];
  },

  set: async (key: string, value: string) => {
    const now = new Date().toISOString();
    await db.collection('user_preferences').updateOne(
      { key },
      { $set: { value, updatedAt: now } },
      { upsert: true }
    );
  },

  get: async (key: string) => {
    const result = await db.collection('user_preferences').findOne({ key });
    if (!result) return undefined;
    return {
      key: result.key,
      value: result.value,
      updatedAt: result.updatedAt
    } as UserPreference;
  }
};
