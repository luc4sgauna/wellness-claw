import { getDb } from "../db.js";

export const manageGoalsTool = {
  name: "manage_wellness_goals",
  description: `Create, update, view, or deactivate wellness goals.
Goal types: sleep_window, training_frequency, daily_steps, weight_target, hydration, bedtime, wake_time, alcohol_limit, stress_management.
Use this when the user sets, changes, or asks about their goals.`,
  parameters: {
    type: "object" as const,
    properties: {
      action: {
        type: "string" as const,
        enum: ["set", "update", "view", "deactivate", "view_all"],
        description: "What to do with the goal",
      },
      telegram_user_id: {
        type: "string" as const,
        description: "The Telegram user ID",
      },
      goal_type: {
        type: "string" as const,
        description: 'Type of goal (e.g., "sleep_window", "training_frequency", "daily_steps")',
      },
      target_value: {
        type: "string" as const,
        description: 'Target value as string (e.g., "22:30-06:30", "4x/week", "10000")',
      },
    },
    required: ["action", "telegram_user_id"],
  },
  execute: async (
    _id: string,
    params: {
      action: string;
      telegram_user_id: string;
      goal_type?: string;
      target_value?: string;
    }
  ) => {
    const db = getDb();
    let text: string;

    switch (params.action) {
      case "set": {
        if (!params.goal_type || !params.target_value) {
          text = "Need goal_type and target_value to set a goal";
          break;
        }
        db.prepare(
          `UPDATE goals SET active = 0, updated_at = datetime('now')
           WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
        ).run(params.telegram_user_id, params.goal_type);

        db.prepare(
          `INSERT INTO goals (telegram_user_id, goal_type, target_value, active)
           VALUES (?, ?, ?, 1)`
        ).run(params.telegram_user_id, params.goal_type, params.target_value);

        text = `Goal set: ${params.goal_type} → ${params.target_value}`;
        break;
      }

      case "update": {
        if (!params.goal_type || !params.target_value) {
          text = "Need goal_type and target_value to update";
          break;
        }
        const result = db
          .prepare(
            `UPDATE goals SET target_value = ?, updated_at = datetime('now')
             WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
          )
          .run(params.target_value, params.telegram_user_id, params.goal_type);

        text = result.changes === 0
          ? `No active goal found for ${params.goal_type}. Use 'set' to create one.`
          : `Updated: ${params.goal_type} → ${params.target_value}`;
        break;
      }

      case "view": {
        if (!params.goal_type) {
          text = "Need goal_type to view a specific goal";
          break;
        }
        const goal = db
          .prepare(
            `SELECT * FROM goals
             WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
          )
          .get(params.telegram_user_id, params.goal_type) as any;

        text = goal
          ? `${params.goal_type}: ${goal.target_value}`
          : `No active goal for ${params.goal_type}`;
        break;
      }

      case "view_all": {
        const goals = db
          .prepare(
            `SELECT goal_type, target_value, created_at, updated_at
             FROM goals WHERE telegram_user_id = ? AND active = 1
             ORDER BY goal_type`
          )
          .all(params.telegram_user_id);

        text = goals.length > 0
          ? JSON.stringify({ active_goals: goals }, null, 2)
          : "No active goals yet.";
        break;
      }

      case "deactivate": {
        if (!params.goal_type) {
          text = "Need goal_type to deactivate";
          break;
        }
        db.prepare(
          `UPDATE goals SET active = 0, updated_at = datetime('now')
           WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
        ).run(params.telegram_user_id, params.goal_type);

        text = `Deactivated: ${params.goal_type}`;
        break;
      }

      default:
        text = "Unknown action";
    }

    return { content: [{ type: "text" as const, text }] };
  },
};
