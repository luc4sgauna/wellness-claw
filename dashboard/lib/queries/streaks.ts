import { getDb } from "../db";

export interface StreakInfo {
  name: string;
  key: string;
  currentStreak: number;
  longestStreak: number;
  total90d: number;
  dates: string[];
}

function calculateStreaks(dateStrs: string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (dateStrs.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const sorted = [...dateStrs].sort().reverse(); // most recent first

  // Current streak — must include today or yesterday
  let currentStreak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let checkDate = new Date(today);

  // Allow streak to start from today or yesterday
  if (sorted[0] === today || sorted[0] === yesterday) {
    checkDate = new Date(sorted[0]);
    for (const d of sorted) {
      if (d === checkDate.toISOString().split("T")[0]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak
  const asc = [...dateStrs].sort();
  let longestStreak = 0;
  let streak = 1;
  for (let i = 1; i < asc.length; i++) {
    const prev = new Date(asc[i - 1]);
    const curr = new Date(asc[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  return { currentStreak, longestStreak };
}

function getNoAlcoholDates(db: ReturnType<typeof getDb>): string[] {
  const rows = db
    .prepare(
      `WITH RECURSIVE dates(d) AS (
         SELECT date('now', '-89 days')
         UNION ALL
         SELECT date(d, '+1 day') FROM dates WHERE d < date('now')
       )
       SELECT d FROM dates
       WHERE d NOT IN (
         SELECT DISTINCT date(logged_at) FROM log_entries
         WHERE category = 'alcohol' AND (subcategory IS NULL OR subcategory != 'none')
         AND logged_at >= datetime('now', '-90 days')
       )
       ORDER BY d DESC`
    )
    .all() as { d: string }[];
  return rows.map((r) => r.d);
}

function getStepsDates(db: ReturnType<typeof getDb>): string[] {
  const rows = db
    .prepare(
      `SELECT date FROM oura_daily
       WHERE steps >= 7000 AND date >= date('now', '-90 days')
       ORDER BY date DESC`
    )
    .all() as { date: string }[];
  return rows.map((r) => r.date);
}

function getActivityDates(db: ReturnType<typeof getDb>): string[] {
  const rows = db
    .prepare(
      `SELECT date FROM oura_daily
       WHERE active_calories >= 400 AND date >= date('now', '-90 days')
       ORDER BY date DESC`
    )
    .all() as { date: string }[];
  return rows.map((r) => r.date);
}

function getProteinDates(db: ReturnType<typeof getDb>): string[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT date(logged_at) as d FROM log_entries
       WHERE category = 'nutrition' AND subcategory = 'protein'
       AND logged_at >= datetime('now', '-90 days')
       ORDER BY d DESC`
    )
    .all() as { d: string }[];
  return rows.map((r) => r.d);
}

function getReadingDates(db: ReturnType<typeof getDb>): string[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT date(logged_at) as d FROM log_entries
       WHERE category = 'reading'
       AND logged_at >= datetime('now', '-90 days')
       ORDER BY d DESC`
    )
    .all() as { d: string }[];
  return rows.map((r) => r.d);
}


export function getStreaks(): StreakInfo[] {
  const db = getDb();

  const streakDefs: { name: string; key: string; getDates: () => string[] }[] =
    [
      { name: "No Alcohol", key: "alcohol", getDates: () => getNoAlcoholDates(db) },
      { name: "Steps (7k+)", key: "steps", getDates: () => getStepsDates(db) },
      { name: "Activity (400+ cal)", key: "activity", getDates: () => getActivityDates(db) },
      { name: "Protein Goal", key: "protein", getDates: () => getProteinDates(db) },
      { name: "Reading", key: "reading", getDates: () => getReadingDates(db) },
    ];

  return streakDefs.map(({ name, key, getDates }) => {
    const dates = getDates();
    const { currentStreak, longestStreak } = calculateStreaks(dates);
    return {
      name,
      key,
      currentStreak,
      longestStreak,
      total90d: dates.length,
      dates,
    };
  });
}
