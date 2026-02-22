import { getDb } from "../db";

// Maps goal_type → log_entries.category used to track progress
const GOAL_LOG_CATEGORY: Record<string, string> = {
  weight_target: "weight",
};

export interface GoalInfo {
  id: number;
  goal_type: string;
  target_value: string;
  created_at: string;
  current_value: number | null;  // most recent logged value, or null
  pct: number;                   // 0–100, calculated from first→latest log toward target
}

export function getGoals(): GoalInfo[] {
  const db = getDb();
  const goals = db
    .prepare(`SELECT id, goal_type, target_value, created_at FROM goals WHERE active = 1 ORDER BY created_at DESC`)
    .all() as { id: number; goal_type: string; target_value: string; created_at: string }[];

  return goals.map((goal) => {
    const logCategory = GOAL_LOG_CATEGORY[goal.goal_type];
    let current_value: number | null = null;
    let pct = 0;

    if (logCategory) {
      const latest = db
        .prepare(`SELECT value FROM log_entries WHERE category = ? AND value IS NOT NULL ORDER BY logged_at DESC LIMIT 1`)
        .get(logCategory) as { value: number } | undefined;
      const oldest = db
        .prepare(`SELECT value FROM log_entries WHERE category = ? AND value IS NOT NULL ORDER BY logged_at ASC LIMIT 1`)
        .get(logCategory) as { value: number } | undefined;

      current_value = latest?.value ?? null;
      const targetNum = parseFloat(goal.target_value);

      if (current_value !== null && oldest !== undefined && !isNaN(targetNum)) {
        const start = oldest.value;
        const range = start - targetNum;
        if (range !== 0) {
          pct = Math.round(((start - current_value) / range) * 100);
          pct = Math.max(0, Math.min(100, pct));
        }
      }
    }

    return { ...goal, current_value, pct };
  });
}
