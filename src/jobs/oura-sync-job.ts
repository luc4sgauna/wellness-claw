import { getDb } from "../db.js";

const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

async function fetchOura(endpoint: string, startDate: string, endDate?: string): Promise<any[]> {
  const pat = process.env.OURA_PAT;
  if (!pat) throw new Error("OURA_PAT environment variable is not set");

  const url = `${OURA_BASE}/${endpoint}?start_date=${startDate}&end_date=${endDate ?? startDate}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${pat}` },
  });

  if (!res.ok) {
    throw new Error(`Oura API error ${res.status} for ${endpoint}: ${await res.text()}`);
  }

  const json = await res.json() as { data: any[] };
  return json.data ?? [];
}

export async function syncOuraForDate(date: string): Promise<void> {
  // sleep endpoint uses exclusive end_date, so advance by one day to include `date`
  const nextDay = new Date(date + "T00:00:00Z");
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextDayStr = nextDay.toISOString().slice(0, 10);

  const [sleepScores, readiness, activity, stress, sleepDetails] = await Promise.all([
    fetchOura("daily_sleep", date),
    fetchOura("daily_readiness", date),
    fetchOura("daily_activity", date),
    fetchOura("daily_stress", date),
    fetchOura("sleep", date, nextDayStr),
  ]);

  const sleep = sleepScores.find((d: any) => d.day === date);
  const ready = readiness.find((d: any) => d.day === date);
  const act = activity.find((d: any) => d.day === date);
  const str = stress.find((d: any) => d.day === date);

  // Pick the longest sleep session for the night ending on this date
  const sleepSessions = sleepDetails.filter((s: any) => s.day === date);
  const mainSleep = sleepSessions.sort(
    (a: any, b: any) => (b.total_sleep_duration ?? 0) - (a.total_sleep_duration ?? 0)
  )[0];

  const db = getDb();
  db.prepare(
    `INSERT INTO oura_daily (date, sleep_score, readiness_score, activity_score,
      hrv_average, resting_hr, total_sleep_minutes, deep_sleep_minutes,
      rem_sleep_minutes, steps, active_calories, bedtime_start, bedtime_end,
      stress_high, recovery_high, day_summary, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
      sleep_score = excluded.sleep_score,
      readiness_score = excluded.readiness_score,
      activity_score = excluded.activity_score,
      hrv_average = excluded.hrv_average,
      resting_hr = excluded.resting_hr,
      total_sleep_minutes = excluded.total_sleep_minutes,
      deep_sleep_minutes = excluded.deep_sleep_minutes,
      rem_sleep_minutes = excluded.rem_sleep_minutes,
      steps = excluded.steps,
      active_calories = excluded.active_calories,
      bedtime_start = excluded.bedtime_start,
      bedtime_end = excluded.bedtime_end,
      stress_high = excluded.stress_high,
      recovery_high = excluded.recovery_high,
      day_summary = excluded.day_summary,
      raw_json = excluded.raw_json,
      synced_at = datetime('now')`
  ).run(
    date,
    sleep?.score ?? null,
    ready?.score ?? null,
    act?.score ?? null,
    mainSleep?.average_hrv ?? null,
    mainSleep?.lowest_heart_rate ?? null,
    mainSleep ? Math.round((mainSleep.total_sleep_duration ?? 0) / 60) : null,
    mainSleep ? Math.round((mainSleep.deep_sleep_duration ?? 0) / 60) : null,
    mainSleep ? Math.round((mainSleep.rem_sleep_duration ?? 0) / 60) : null,
    act?.steps ?? null,
    act?.active_calories ?? null,
    mainSleep?.bedtime_start ?? null,
    mainSleep?.bedtime_end ?? null,
    str?.stress_high ?? null,
    str?.recovery_high ?? null,
    str?.day_summary ?? null,
    JSON.stringify({ sleep, readiness: ready, activity: act, stress: str, sleepSessions })
  );

  console.log(`[OuraSync] Synced ${date}: sleep=${sleep?.score ?? "?"} readiness=${ready?.score ?? "?"} HRV=${mainSleep?.average_hrv ?? "?"}`);
}

export async function runOuraSync(): Promise<void> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  console.log("[OuraSync] Starting daily sync...");
  try {
    await syncOuraForDate(fmt(yesterday));
  } catch (err) {
    console.error(`[OuraSync] Failed for ${fmt(yesterday)}:`, err);
  }
  try {
    await syncOuraForDate(fmt(today));
  } catch (err) {
    console.error(`[OuraSync] Failed for ${fmt(today)}:`, err);
  }
  console.log("[OuraSync] Done.");
}
