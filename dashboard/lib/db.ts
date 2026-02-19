import Database from "better-sqlite3";
import path from "path";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const stateDir =
    process.env.OPENCLAW_STATE_DIR ||
    path.join(process.env.HOME || "~", ".openclaw");
  const dbPath = path.join(stateDir, "wellness-claw", "wellness.db");

  _db = new Database(dbPath, { readonly: true });
  _db.pragma("journal_mode = WAL");
  return _db;
}
