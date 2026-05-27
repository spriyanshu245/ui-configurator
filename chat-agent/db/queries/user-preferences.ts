import { db } from '../client';

export interface UserPreference {
  key: string;
  value: string;
  updatedAt: string;
}

export const userPreferences = {
  findAll: () => {
    const stmt = db.prepare('SELECT * FROM user_preferences');
    return stmt.all() as UserPreference[];
  },

  set: (key: string, value: string) => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO user_preferences (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
    `);
    stmt.run(key, value, now);
  },

  get: (key: string) => {
    const stmt = db.prepare('SELECT * FROM user_preferences WHERE key = ?');
    return stmt.get(key) as UserPreference | undefined;
  }
};
