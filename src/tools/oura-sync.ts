import { getDb } from "../db.js";

export const ouraSyncTool = {
  name: "sync_oura_to_db",
  description: `Store Oura daily data into the structured database for correlation analysis.
Call this after retrieving Oura data via the oura_data tool (from OuraClaw).
Pass the Oura metrics so they can be stored alongside wellness logs for insights queries.`,
  schema: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "Date in YYYY-MM-DD format",
      },
      sleep_score: { type: "number" },
      readiness_score: { type: "number" },
      activity_score: { type: "number" },
      hrv_average: { type: "number" },
      resting_hr: { type: "number" },
      total_sleep_minutes: { type: "number" },
      deep_sleep_minutes: { type: "number" },
      rem_sleep_minutes: { type: "number" },
      steps: { type: "number" },
      active_calories: { type: "number" },
      bedtime_start: { type: "string" },
      bedtime_end: { type: "string" },
      raw_json: {
        type: "string",
        description: "Full Oura API response as JSON string (for future use)",
      },
    },
    required: ["date"],
  },
  handler: async (params: {
    date: string;
    sleep_score?: number;
    readiness_score?: number;
    activity_score?: number;
    hrv_average?: number;
    resting_hr?: number;
    total_sleep_minutes?: number;
    deep_sleep_minutes?: number;
    rem_sleep_minutes?: number;
    steps?: number;
    active_calories?: number;
    bedtime_start?: string;
    bedtime_end?: string;
    raw_json?: string;
  }) => {
    const db = getDb();

    db.prepare(
      `INSERT INTO oura_daily (date, sleep_score, readiness_score, activity_score,
        hrv_average, resting_hr, total_sleep_minutes, deep_sleep_minutes,
        rem_sleep_minutes, steps, active_calories, bedtime_start, bedtime_end, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        raw_json = excluded.raw_json,
        synced_at = datetime('now')`
    ).run(
      params.date,
      params.sleep_score ?? null,
      params.readiness_score ?? null,
      params.activity_score ?? null,
      params.hrv_average ?? null,
      params.resting_hr ?? null,
      params.total_sleep_minutes ?? null,
      params.deep_sleep_minutes ?? null,
      params.rem_sleep_minutes ?? null,
      params.steps ?? null,
      params.active_calories ?? null,
      params.bedtime_start ?? null,
      params.bedtime_end ?? null,
      params.raw_json ?? null
    );

    return {
      text: `Oura data synced for ${params.date}: sleep=${params.sleep_score ?? "?"} readiness=${params.readiness_score ?? "?"} HRV=${params.hrv_average ?? "?"}`,
    };
  },
};
