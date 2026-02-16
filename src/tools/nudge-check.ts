import { getDb } from "../db.js";

export const nudgeCheckTool = {
  name: "check_nudge_status",
  description: `Check if nudges are allowed right now (rate limiting, snooze, mute).
Call this BEFORE sending any proactive nudge to the user.
Returns whether sending is allowed and why/why not.`,
  parameters: {
    type: "object" as const,
    properties: {
      telegram_user_id: {
        type: "string" as const,
        description: "The Telegram user ID",
      },
      nudge_type: {
        type: "string" as const,
        enum: ["morning_readiness", "afternoon_movement", "evening_winddown", "general"],
        description: "Type of nudge being considered",
      },
      max_per_day: {
        type: "number" as const,
        description: "Maximum nudges allowed per day (default: 3)",
      },
    },
    required: ["telegram_user_id", "nudge_type"],
  },
  execute: async (
    _id: string,
    params: {
      telegram_user_id: string;
      nudge_type: string;
      max_per_day?: number;
    }
  ) => {
    const db = getDb();
    const maxPerDay = params.max_per_day || 3;

    const muted = db
      .prepare(
        `SELECT * FROM nudge_log WHERE telegram_user_id = ? AND muted = 1
         ORDER BY sent_at DESC LIMIT 1`
      )
      .get(params.telegram_user_id);

    if (muted) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ allowed: false, reason: "muted" }) }] };
    }

    const snoozed = db
      .prepare(
        `SELECT * FROM nudge_log WHERE telegram_user_id = ?
           AND snoozed_until IS NOT NULL AND snoozed_until > datetime('now')
         ORDER BY snoozed_until DESC LIMIT 1`
      )
      .get(params.telegram_user_id) as any;

    if (snoozed) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ allowed: false, reason: "snoozed", snoozed_until: snoozed.snoozed_until }) }],
      };
    }

    const todayCount = (db
      .prepare(
        `SELECT COUNT(*) as count FROM nudge_log
         WHERE telegram_user_id = ? AND nudge_type != 'all'
           AND sent_at >= date('now') AND muted = 0 AND snoozed_until IS NULL`
      )
      .get(params.telegram_user_id) as any).count;

    if (todayCount >= maxPerDay) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ allowed: false, reason: "rate_limited", sent_today: todayCount }) }],
      };
    }

    const typeToday = (db
      .prepare(
        `SELECT COUNT(*) as count FROM nudge_log
         WHERE telegram_user_id = ? AND nudge_type = ?
           AND sent_at >= date('now') AND muted = 0 AND snoozed_until IS NULL`
      )
      .get(params.telegram_user_id, params.nudge_type) as any).count;

    if (typeToday > 0) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ allowed: false, reason: "already_sent_today" }) }],
      };
    }

    db.prepare(
      `INSERT INTO nudge_log (telegram_user_id, nudge_type) VALUES (?, ?)`
    ).run(params.telegram_user_id, params.nudge_type);

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ allowed: true, sent_today: todayCount + 1 }) }],
    };
  },
};
