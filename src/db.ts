import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _db: Database.Database | null = null;

export function getDb(dataDir?: string): Database.Database {
  if (_db) return _db;

  const stateDir = process.env.OPENCLAW_STATE_DIR || path.join(process.env.HOME || "~", ".openclaw");
  const dir = dataDir || path.join(stateDir, "wellness-claw");
  fs.mkdirSync(dir, { recursive: true });

  _db = new Database(path.join(dir, "wellness.db"));
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  migrate(_db);
  return _db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    -- Every raw message preserved
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      intent TEXT CHECK(intent IN ('LOG','QUERY','ADMIN','CHAT','GOAL')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Structured log entries parsed from natural language
    CREATE TABLE IF NOT EXISTS log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER REFERENCES messages(id),
      category TEXT NOT NULL,
      subcategory TEXT,
      value REAL,
      unit TEXT,
      notes TEXT,
      logged_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Oura daily summaries (synced via Personal Access Token)
    CREATE TABLE IF NOT EXISTS oura_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      sleep_score INTEGER,
      readiness_score INTEGER,
      activity_score INTEGER,
      hrv_average REAL,
      resting_hr REAL,
      total_sleep_minutes INTEGER,
      deep_sleep_minutes INTEGER,
      rem_sleep_minutes INTEGER,
      steps INTEGER,
      active_calories INTEGER,
      bedtime_start TEXT,
      bedtime_end TEXT,
      raw_json TEXT,
      stress_high INTEGER,
      recovery_high INTEGER,
      day_summary TEXT,
      synced_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- User goals
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id TEXT NOT NULL,
      goal_type TEXT NOT NULL,
      target_value TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Nudge tracking for rate limiting
    CREATE TABLE IF NOT EXISTS nudge_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_user_id TEXT NOT NULL,
      nudge_type TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      snoozed_until TEXT,
      muted INTEGER NOT NULL DEFAULT 0
    );

    -- Migrations for existing databases
    -- These are no-ops if columns already exist (SQLite doesn't support IF NOT EXISTS for ALTER)
  `);

  // Add stress columns to oura_daily if they don't exist yet
  const cols = db.prepare("PRAGMA table_info(oura_daily)").all() as { name: string }[];
  const colNames = cols.map(c => c.name);
  if (!colNames.includes("stress_high"))   db.exec("ALTER TABLE oura_daily ADD COLUMN stress_high INTEGER");
  if (!colNames.includes("recovery_high")) db.exec("ALTER TABLE oura_daily ADD COLUMN recovery_high INTEGER");
  if (!colNames.includes("day_summary"))   db.exec("ALTER TABLE oura_daily ADD COLUMN day_summary TEXT");

  db.exec(`
    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_log_entries_category ON log_entries(category);
    CREATE INDEX IF NOT EXISTS idx_log_entries_logged_at ON log_entries(logged_at);
    CREATE INDEX IF NOT EXISTS idx_oura_daily_date ON oura_daily(date);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_nudge_log_sent ON nudge_log(sent_at);
  `);
}
