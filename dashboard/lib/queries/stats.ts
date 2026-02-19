import { getDb } from "../db";

export function getOverviewStats() {
  const db = getDb();

  const totalEntries = (
    db.prepare(`SELECT COUNT(*) as count FROM log_entries`).get() as {
      count: number;
    }
  ).count;

  const ouraDays = (
    db.prepare(`SELECT COUNT(*) as count FROM oura_daily`).get() as {
      count: number;
    }
  ).count;

  const activeGoals = (
    db.prepare(`SELECT COUNT(*) as count FROM goals WHERE active = 1`).get() as {
      count: number;
    }
  ).count;

  const categories = db
    .prepare(
      `SELECT category, COUNT(*) as count
       FROM log_entries
       WHERE logged_at >= datetime('now', '-30 days')
       GROUP BY category ORDER BY count DESC`
    )
    .all() as { category: string; count: number }[];

  const thisWeekEntries = (
    db
      .prepare(
        `SELECT COUNT(*) as count FROM log_entries
         WHERE logged_at >= datetime('now', '-7 days')`
      )
      .get() as { count: number }
  ).count;

  return { totalEntries, ouraDays, activeGoals, categories, thisWeekEntries };
}
