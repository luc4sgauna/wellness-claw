import { getDb } from "../db";

export interface OuraDay {
  date: string;
  sleep_score: number | null;
  readiness_score: number | null;
  activity_score: number | null;
  hrv_average: number | null;
  resting_hr: number | null;
  total_sleep_minutes: number | null;
  deep_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  steps: number | null;
  active_calories: number | null;
  bedtime_start: string | null;
  bedtime_end: string | null;
}

export function getOuraDays(days: number): OuraDay[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT date, sleep_score, readiness_score, activity_score,
              hrv_average, resting_hr, total_sleep_minutes,
              deep_sleep_minutes, rem_sleep_minutes, steps,
              active_calories, bedtime_start, bedtime_end
       FROM oura_daily
       WHERE date >= date('now', ?)
       ORDER BY date ASC`
    )
    .all(`-${days} days`) as OuraDay[];
}

export function getLatestOura(): OuraDay | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT date, sleep_score, readiness_score, activity_score,
                hrv_average, resting_hr, total_sleep_minutes,
                deep_sleep_minutes, rem_sleep_minutes, steps,
                active_calories, bedtime_start, bedtime_end
         FROM oura_daily ORDER BY date DESC LIMIT 1`
      )
      .get() as OuraDay | undefined) ?? null
  );
}

export function getOuraDayCount(): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM oura_daily`)
    .get() as { count: number };
  return row.count;
}
