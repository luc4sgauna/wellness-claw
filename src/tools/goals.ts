import { getDb } from "../db.js";

export const manageGoalsTool = {
  name: "manage_wellness_goals",
  description: `Create, update, view, or deactivate wellness goals.
Goal types: sleep_window, training_frequency, daily_steps, weight_target, hydration, bedtime, wake_time, alcohol_limit, stress_management.
Use this when the user sets, changes, or asks about their goals.`,
  schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["set", "update", "view", "deactivate", "view_all"],
        description: "What to do with the goal",
      },
      telegram_user_id: {
        type: "string",
        description: "The Telegram user ID",
      },
      goal_type: {
        type: "string",
        description:
          'Type of goal (e.g., "sleep_window", "training_frequency", "daily_steps")',
      },
      target_value: {
        type: "string",
        description:
          'Target value as string (e.g., "22:30-06:30", "4x/week", "10000")',
      },
    },
    required: ["action", "telegram_user_id"],
  },
  handler: async (params: {
    action: string;
    telegram_user_id: string;
    goal_type?: string;
    target_value?: string;
  }) => {
    const db = getDb();

    switch (params.action) {
      case "set": {
        if (!params.goal_type || !params.target_value) {
          return { text: "Need goal_type and target_value to set a goal", error: true };
        }

        // Deactivate existing goal of same type
        db.prepare(
          `UPDATE goals SET active = 0, updated_at = datetime('now')
           WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
        ).run(params.telegram_user_id, params.goal_type);

        db.prepare(
          `INSERT INTO goals (telegram_user_id, goal_type, target_value, active)
           VALUES (?, ?, ?, 1)`
        ).run(params.telegram_user_id, params.goal_type, params.target_value);

        return {
          text: `Goal set: ${params.goal_type} → ${params.target_value}`,
        };
      }

      case "update": {
        if (!params.goal_type || !params.target_value) {
          return { text: "Need goal_type and target_value to update", error: true };
        }

        const result = db
          .prepare(
            `UPDATE goals SET target_value = ?, updated_at = datetime('now')
           WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
          )
          .run(params.target_value, params.telegram_user_id, params.goal_type);

        if (result.changes === 0) {
          return { text: `No active goal found for ${params.goal_type}. Use 'set' to create one.` };
        }

        return {
          text: `Updated: ${params.goal_type} → ${params.target_value}`,
        };
      }

      case "view": {
        if (!params.goal_type) {
          return { text: "Need goal_type to view a specific goal", error: true };
        }

        const goal = db
          .prepare(
            `SELECT * FROM goals
           WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
          )
          .get(params.telegram_user_id, params.goal_type);

        return goal
          ? { text: `${params.goal_type}: ${(goal as any).target_value}`, goal }
          : { text: `No active goal for ${params.goal_type}` };
      }

      case "view_all": {
        const goals = db
          .prepare(
            `SELECT goal_type, target_value, created_at, updated_at
           FROM goals WHERE telegram_user_id = ? AND active = 1
           ORDER BY goal_type`
          )
          .all(params.telegram_user_id);

        return {
          text: `${goals.length} active goals`,
          goals,
        };
      }

      case "deactivate": {
        if (!params.goal_type) {
          return { text: "Need goal_type to deactivate", error: true };
        }

        db.prepare(
          `UPDATE goals SET active = 0, updated_at = datetime('now')
           WHERE telegram_user_id = ? AND goal_type = ? AND active = 1`
        ).run(params.telegram_user_id, params.goal_type);

        return { text: `Deactivated: ${params.goal_type}` };
      }

      default:
        return { text: "Unknown action", error: true };
    }
  },
};
