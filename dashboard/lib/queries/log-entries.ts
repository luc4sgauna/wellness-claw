import { getDb } from "../db";

export interface LogEntry {
  id: number;
  category: string;
  subcategory: string | null;
  value: number | null;
  unit: string | null;
  notes: string | null;
  logged_at: string;
}

export function getEntriesByDateRange(days: number): LogEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, category, subcategory, value, unit, notes, logged_at
       FROM log_entries
       WHERE logged_at >= datetime('now', ?)
       ORDER BY logged_at DESC`
    )
    .all(`-${days} days`) as LogEntry[];
}

export function getEntriesGroupedByDay(days: number) {
  const entries = getEntriesByDateRange(days);
  const grouped: Record<string, LogEntry[]> = {};
  for (const entry of entries) {
    const date = entry.logged_at.split("T")[0].split(" ")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(entry);
  }
  return grouped;
}

export function getRecentEntries(limit: number = 10): LogEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, category, subcategory, value, unit, notes, logged_at
       FROM log_entries ORDER BY logged_at DESC LIMIT ?`
    )
    .all(limit) as LogEntry[];
}
