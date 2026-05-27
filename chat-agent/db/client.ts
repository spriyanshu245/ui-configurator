import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.AGENT_DB_PATH || path.join(process.cwd(), 'chat-agent/db/agent.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS skill_entries (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence REAL NOT NULL,
    source TEXT NOT NULL,
    usageCount INTEGER DEFAULT 0,
    embedding TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dsl_history (
    id TEXT PRIMARY KEY,
    micrositeId TEXT NOT NULL,
    pagePath TEXT NOT NULL,
    dslSnapshot TEXT NOT NULL,
    operation TEXT NOT NULL,
    patchApplied TEXT,
    description TEXT NOT NULL,
    approvedBy TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tool_call_log (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    toolName TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    durationMs INTEGER NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pending_patches (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    micrositeId TEXT NOT NULL,
    pagePath TEXT NOT NULL,
    patch TEXT NOT NULL,
    description TEXT NOT NULL,
    previewHint TEXT NOT NULL,
    affectedComponents TEXT NOT NULL,
    currentDsl TEXT NOT NULL,
    patchedDsl TEXT NOT NULL,
    proposedAt TEXT NOT NULL
  );
`);
