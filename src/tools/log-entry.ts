import { getDb } from "../db.js";

export const logEntryTool = {
  name: "log_wellness_entry",
  description: `Log a structured wellness entry extracted from the user's natural language message.
Categories: exercise, stress, alcohol, sleep, mood, nutrition, hydration, medication, symptom, other.
Always store the raw message AND the extracted structured fields.
Only call this tool when the message clearly contains something to log.`,
  schema: {
    type: "object",
    properties: {
      raw_message: {
        type: "string",
        description: "The user's original message text, verbatim",
      },
      telegram_user_id: {
        type: "string",
        description: "The Telegram user ID",
      },
      category: {
        type: "string",
        enum: [
          "exercise",
          "stress",
          "alcohol",
          "sleep",
          "mood",
          "nutrition",
          "hydration",
          "medication",
          "symptom",
          "other",
        ],
        description: "The primary category of the log entry",
      },
      subcategory: {
        type: "string",
        description:
          "Specific type within category (e.g., 'HIIT', 'pickleball', 'wine', 'bedtime', 'anxious')",
      },
      value: {
        type: "number",
        description:
          "Numeric value if applicable (duration in minutes, count of drinks, rating 1-10, etc.)",
      },
      unit: {
        type: "string",
        description:
          "Unit for the value (minutes, drinks, rating, hours, steps, etc.)",
      },
      notes: {
        type: "string",
        description: "Any additional context extracted from the message",
      },
    },
    required: ["raw_message", "telegram_user_id", "category"],
  },
  handler: async (params: {
    raw_message: string;
    telegram_user_id: string;
    category: string;
    subcategory?: string;
    value?: number;
    unit?: string;
    notes?: string;
  }) => {
    const db = getDb();

    // Store the raw message
    const msgResult = db
      .prepare(
        `INSERT INTO messages (telegram_user_id, text, intent, created_at)
       VALUES (?, ?, 'LOG', datetime('now'))`
      )
      .run(params.telegram_user_id, params.raw_message);

    const messageId = msgResult.lastInsertRowid;

    // Store the structured entry
    db.prepare(
      `INSERT INTO log_entries (message_id, category, subcategory, value, unit, notes, logged_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      messageId,
      params.category,
      params.subcategory || null,
      params.value || null,
      params.unit || null,
      params.notes || null
    );

    return {
      text: `Logged: ${params.category}${params.subcategory ? ` (${params.subcategory})` : ""}${params.value ? ` — ${params.value} ${params.unit || ""}` : ""}`,
      entry_id: messageId,
    };
  },
};
