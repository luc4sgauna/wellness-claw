import { getDb } from "../db.js";

export const queryLogsTool = {
  name: "query_wellness_logs",
  description: `Query the user's wellness log history. Use this to answer questions about their habits,
find patterns, or display recent entries. Supports filtering by category, date range, and limit.`,
  parameters: {
    type: "object" as const,
    properties: {
      category: {
        type: "string" as const,
        description: "Filter by category (exercise, stress, alcohol, sleep, mood, etc.)",
      },
      days_back: {
        type: "number" as const,
        description: "Number of days to look back (default: 30)",
      },
      limit: {
        type: "number" as const,
        description: "Max entries to return (default: 50)",
      },
      date_from: {
        type: "string" as const,
        description: "Start date (YYYY-MM-DD). Overrides days_back if provided.",
      },
      date_to: {
        type: "string" as const,
        description: "End date (YYYY-MM-DD). Defaults to today.",
      },
    },
    required: [] as string[],
  },
  execute: async (
    _id: string,
    params: {
      category?: string;
      days_back?: number;
      limit?: number;
      date_from?: string;
      date_to?: string;
    }
  ) => {
    const db = getDb();
    const daysBack = params.days_back || 30;
    const limit = params.limit || 50;

    let query = `
      SELECT le.*, m.text as raw_message, m.created_at as message_time
      FROM log_entries le
      JOIN messages m ON le.message_id = m.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.category) {
      query += ` AND le.category = ?`;
      queryParams.push(params.category);
    }

    if (params.date_from) {
      query += ` AND le.logged_at >= ?`;
      queryParams.push(params.date_from);
    } else {
      query += ` AND le.logged_at >= datetime('now', ?)`;
      queryParams.push(`-${daysBack} days`);
    }

    if (params.date_to) {
      query += ` AND le.logged_at <= ?`;
      queryParams.push(params.date_to + " 23:59:59");
    }

    query += ` ORDER BY le.logged_at DESC LIMIT ?`;
    queryParams.push(limit);

    const entries = db.prepare(query).all(...queryParams);

    const summary = db
      .prepare(
        `SELECT category, COUNT(*) as count,
                AVG(value) as avg_value, unit
         FROM log_entries
         WHERE logged_at >= datetime('now', ?)
         GROUP BY category
         ORDER BY count DESC`
      )
      .all(`-${daysBack} days`);

    const result = { entries, summary, total: entries.length };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
};
