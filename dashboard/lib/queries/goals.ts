import { getDb } from "../db";

export interface Goal {
  id: number;
  goal_type: string;
  target_value: string;
  created_at: string;
  updated_at: string;
}

export function getActiveGoals(): Goal[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, goal_type, target_value, created_at, updated_at
       FROM goals WHERE active = 1 ORDER BY goal_type`
    )
    .all() as Goal[];
}

export function getGoalProgress(goal: Goal) {
  const db = getDb();

  switch (goal.goal_type) {
    case "training_frequency": {
      const match = goal.target_value.match(/(\d+)x?\/?week/i);
      const target = match ? parseInt(match[1]) : 4;
      const row = db
        .prepare(
          `SELECT COUNT(DISTINCT date(logged_at)) as days
           FROM log_entries
           WHERE category = 'exercise' AND logged_at >= datetime('now', '-7 days')`
        )
        .get() as { days: number };
      return { current: row.days, target, unit: "days/week", pct: Math.min(100, Math.round((row.days / target) * 100)) };
    }
    case "daily_steps": {
      const target = parseInt(goal.target_value) || 10000;
      const row = db
        .prepare(
          `SELECT AVG(steps) as avg_steps FROM oura_daily
           WHERE date >= date('now', '-7 days') AND steps IS NOT NULL`
        )
        .get() as { avg_steps: number | null };
      const current = Math.round(row.avg_steps ?? 0);
      return { current, target, unit: "steps avg", pct: Math.min(100, Math.round((current / target) * 100)) };
    }
    case "sleep_window":
    case "bedtime": {
      const match = goal.target_value.match(/(\d{1,2}):(\d{2})/);
      if (!match) return { current: 0, target: 0, unit: "time", pct: 0 };
      const targetHour = parseInt(match[1]);
      const targetMin = parseInt(match[2]);
      const rows = db
        .prepare(
          `SELECT bedtime_start FROM oura_daily
           WHERE date >= date('now', '-7 days') AND bedtime_start IS NOT NULL`
        )
        .all() as { bedtime_start: string }[];
      let onTarget = 0;
      for (const r of rows) {
        const d = new Date(r.bedtime_start);
        const h = d.getHours();
        const m = d.getMinutes();
        const totalMin = h * 60 + m;
        const targetTotal = targetHour * 60 + targetMin;
        if (Math.abs(totalMin - targetTotal) <= 30) onTarget++;
      }
      const total = rows.length || 1;
      return { current: onTarget, target: total, unit: "nights on target", pct: Math.round((onTarget / total) * 100) };
    }
    case "alcohol_limit": {
      const target = parseInt(goal.target_value) || 3;
      const row = db
        .prepare(
          `SELECT COUNT(*) as count FROM log_entries
           WHERE category = 'alcohol' AND logged_at >= datetime('now', '-7 days')`
        )
        .get() as { count: number };
      const current = row.count;
      const pct = current <= target ? 100 : Math.max(0, Math.round(((target * 2 - current) / target) * 100));
      return { current, target, unit: "drinks/week", pct };
    }
    default: {
      return { current: 0, target: 0, unit: "", pct: 0 };
    }
  }
}
