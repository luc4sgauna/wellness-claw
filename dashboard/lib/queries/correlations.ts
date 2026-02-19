import { getDb } from "../db";

export function getStressVsSleep(days: number) {
  const db = getDb();
  const since = `-${days} days`;

  const detail = db
    .prepare(
      `SELECT le.logged_at as stress_date, le.value as stress_level, le.notes,
              o_next.sleep_score, o_next.hrv_average, o_next.total_sleep_minutes,
              o_next.deep_sleep_minutes, o_next.date as sleep_date
       FROM log_entries le
       LEFT JOIN oura_daily o_next ON o_next.date = date(le.logged_at, '+1 day')
       WHERE le.category = 'stress' AND le.logged_at >= datetime('now', ?)
       ORDER BY le.logged_at`
    )
    .all(since);

  const afterStress = db
    .prepare(
      `SELECT AVG(o.sleep_score) as avg_sleep, AVG(o.hrv_average) as avg_hrv,
              AVG(o.deep_sleep_minutes) as avg_deep
       FROM oura_daily o WHERE o.date IN (
         SELECT date(le.logged_at, '+1 day') FROM log_entries le
         WHERE le.category = 'stress' AND le.logged_at >= datetime('now', ?)
       )`
    )
    .get(since);

  const noStress = db
    .prepare(
      `SELECT AVG(o.sleep_score) as avg_sleep, AVG(o.hrv_average) as avg_hrv,
              AVG(o.deep_sleep_minutes) as avg_deep
       FROM oura_daily o WHERE o.date >= date('now', ?)
         AND o.date NOT IN (
           SELECT date(le.logged_at, '+1 day') FROM log_entries le
           WHERE le.category = 'stress' AND le.logged_at >= datetime('now', ?)
         )`
    )
    .get(since, since);

  return { detail, afterStress, noStress, sampleSize: (detail as unknown[]).length };
}

export function getAlcoholVsHrv(days: number) {
  const db = getDb();
  const since = `-${days} days`;

  const detail = db
    .prepare(
      `SELECT le.logged_at as drink_date, le.value as drinks, le.subcategory as drink_type,
              o_next.hrv_average, o_next.resting_hr, o_next.sleep_score,
              o_next.deep_sleep_minutes, o_next.date as next_day
       FROM log_entries le
       LEFT JOIN oura_daily o_next ON o_next.date = date(le.logged_at, '+1 day')
       WHERE le.category = 'alcohol' AND le.logged_at >= datetime('now', ?)
       ORDER BY le.logged_at`
    )
    .all(since);

  const afterAlcohol = db
    .prepare(
      `SELECT AVG(o.hrv_average) as avg_hrv, AVG(o.resting_hr) as avg_rhr,
              AVG(o.deep_sleep_minutes) as avg_deep
       FROM oura_daily o WHERE o.date IN (
         SELECT date(le.logged_at, '+1 day') FROM log_entries le
         WHERE le.category = 'alcohol' AND le.logged_at >= datetime('now', ?)
       )`
    )
    .get(since);

  const noAlcohol = db
    .prepare(
      `SELECT AVG(o.hrv_average) as avg_hrv, AVG(o.resting_hr) as avg_rhr,
              AVG(o.deep_sleep_minutes) as avg_deep
       FROM oura_daily o WHERE o.date >= date('now', ?)
         AND o.date NOT IN (
           SELECT date(le.logged_at, '+1 day') FROM log_entries le
           WHERE le.category = 'alcohol' AND le.logged_at >= datetime('now', ?)
         )`
    )
    .get(since, since);

  return { detail, afterAlcohol, noAlcohol, sampleSize: (detail as unknown[]).length };
}

export function getExerciseVsReadiness(days: number) {
  const db = getDb();
  const since = `-${days} days`;

  const detail = db
    .prepare(
      `SELECT le.logged_at as exercise_date, le.subcategory as exercise_type,
              le.value as duration_min, o_next.readiness_score, o_next.hrv_average,
              o_next.activity_score, o_next.date as next_day
       FROM log_entries le
       LEFT JOIN oura_daily o_next ON o_next.date = date(le.logged_at, '+1 day')
       WHERE le.category = 'exercise' AND le.logged_at >= datetime('now', ?)
       ORDER BY le.logged_at`
    )
    .all(since);

  return { detail, sampleSize: (detail as unknown[]).length };
}

export function getSleepLevers(days: number) {
  const db = getDb();
  const since = `-${days} days`;

  const sleepData = db
    .prepare(
      `SELECT o.date, o.sleep_score, o.hrv_average, o.deep_sleep_minutes,
              o.total_sleep_minutes, o.bedtime_start, o.resting_hr
       FROM oura_daily o WHERE o.date >= date('now', ?)
       ORDER BY o.sleep_score DESC`
    )
    .all(since) as { sleep_score: number }[];

  const median =
    sleepData.length > 0
      ? sleepData[Math.floor(sleepData.length / 2)]
      : null;
  const threshold = median ? median.sleep_score : 75;

  const beforeGoodSleep = db
    .prepare(
      `SELECT le.category, le.subcategory, COUNT(*) as count, AVG(le.value) as avg_value
       FROM log_entries le JOIN oura_daily o ON date(le.logged_at) = date(o.date, '-1 day')
       WHERE o.sleep_score >= ? AND o.date >= date('now', ?)
       GROUP BY le.category, le.subcategory ORDER BY count DESC`
    )
    .all(threshold, since);

  const beforeBadSleep = db
    .prepare(
      `SELECT le.category, le.subcategory, COUNT(*) as count, AVG(le.value) as avg_value
       FROM log_entries le JOIN oura_daily o ON date(le.logged_at) = date(o.date, '-1 day')
       WHERE o.sleep_score < ? AND o.date >= date('now', ?)
       GROUP BY le.category, le.subcategory ORDER BY count DESC`
    )
    .all(threshold, since);

  return {
    sleepData,
    threshold,
    totalNights: sleepData.length,
    beforeGoodSleep,
    beforeBadSleep,
  };
}
