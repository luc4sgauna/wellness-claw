import { getDb } from "../db.js";
import fs from "fs";
import path from "path";

export const adminTool = {
  name: "admin_wellness",
  description: `Administrative actions: delete entries, wipe date ranges, export data (CSV/JSON), view stats.
Use when the user says things like "delete last entry", "export my data", "wipe last week", "show stats".`,
  schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "delete_last",
          "delete_entry",
          "wipe_date_range",
          "export_csv",
          "export_json",
          "stats",
          "snooze_nudges",
          "mute_nudges",
          "unmute_nudges",
        ],
        description: "The admin action to perform",
      },
      telegram_user_id: {
        type: "string",
        description: "The Telegram user ID",
      },
      entry_id: {
        type: "number",
        description: "Specific entry ID to delete (for delete_entry)",
      },
      date_from: {
        type: "string",
        description: "Start date for wipe/export (YYYY-MM-DD)",
      },
      date_to: {
        type: "string",
        description: "End date for wipe/export (YYYY-MM-DD)",
      },
      snooze_hours: {
        type: "number",
        description: "Hours to snooze nudges (for snooze_nudges)",
        default: 4,
      },
    },
    required: ["action", "telegram_user_id"],
  },
  handler: async (params: {
    action: string;
    telegram_user_id: string;
    entry_id?: number;
    date_from?: string;
    date_to?: string;
    snooze_hours?: number;
  }) => {
    const db = getDb();

    switch (params.action) {
      case "delete_last": {
        const last = db
          .prepare(
            `SELECT le.id, le.category, le.subcategory, m.text
             FROM log_entries le JOIN messages m ON le.message_id = m.id
             ORDER BY le.logged_at DESC LIMIT 1`
          )
          .get() as any;

        if (!last) return { text: "No entries to delete" };

        db.prepare(`DELETE FROM log_entries WHERE id = ?`).run(last.id);
        return {
          text: `Deleted last entry: ${last.category}${last.subcategory ? ` (${last.subcategory})` : ""} — "${last.text}"`,
        };
      }

      case "delete_entry": {
        if (!params.entry_id) return { text: "Need entry_id", error: true };
        db.prepare(`DELETE FROM log_entries WHERE id = ?`).run(params.entry_id);
        return { text: `Deleted entry #${params.entry_id}` };
      }

      case "wipe_date_range": {
        if (!params.date_from || !params.date_to) {
          return { text: "Need date_from and date_to for wipe", error: true };
        }
        const result = db
          .prepare(
            `DELETE FROM log_entries
             WHERE logged_at >= ? AND logged_at <= ?`
          )
          .run(params.date_from, params.date_to + " 23:59:59");
        return { text: `Wiped ${result.changes} entries from ${params.date_from} to ${params.date_to}` };
      }

      case "export_csv": {
        const entries = db
          .prepare(
            `SELECT le.id, le.category, le.subcategory, le.value, le.unit,
                    le.notes, le.logged_at, m.text as raw_message
             FROM log_entries le
             JOIN messages m ON le.message_id = m.id
             ORDER BY le.logged_at`
          )
          .all() as any[];

        const header =
          "id,category,subcategory,value,unit,notes,logged_at,raw_message";
        const rows = entries.map(
          (e) =>
            `${e.id},"${e.category}","${e.subcategory || ""}",${e.value || ""},"${e.unit || ""}","${(e.notes || "").replace(/"/g, '""')}","${e.logged_at}","${(e.raw_message || "").replace(/"/g, '""')}"`
        );
        const csv = [header, ...rows].join("\n");

        const exportDir = path.join(
          process.env.HOME || "~",
          ".openclaw",
          "wellness-claw",
          "exports"
        );
        fs.mkdirSync(exportDir, { recursive: true });
        const filePath = path.join(
          exportDir,
          `wellness-export-${new Date().toISOString().split("T")[0]}.csv`
        );
        fs.writeFileSync(filePath, csv);

        return {
          text: `Exported ${entries.length} entries to CSV`,
          file_path: filePath,
          preview: csv.split("\n").slice(0, 5).join("\n"),
        };
      }

      case "export_json": {
        const entries = db
          .prepare(
            `SELECT le.*, m.text as raw_message
             FROM log_entries le
             JOIN messages m ON le.message_id = m.id
             ORDER BY le.logged_at`
          )
          .all();

        const oura = db
          .prepare(`SELECT * FROM oura_daily ORDER BY date`)
          .all();

        const goals = db
          .prepare(
            `SELECT * FROM goals WHERE telegram_user_id = ? AND active = 1`
          )
          .all(params.telegram_user_id);

        const data = { log_entries: entries, oura_daily: oura, goals };

        const exportDir = path.join(
          process.env.HOME || "~",
          ".openclaw",
          "wellness-claw",
          "exports"
        );
        fs.mkdirSync(exportDir, { recursive: true });
        const filePath = path.join(
          exportDir,
          `wellness-export-${new Date().toISOString().split("T")[0]}.json`
        );
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        return {
          text: `Exported ${entries.length} logs + ${oura.length} Oura days + ${goals.length} goals to JSON`,
          file_path: filePath,
        };
      }

      case "stats": {
        const totalLogs = db
          .prepare(`SELECT COUNT(*) as count FROM log_entries`)
          .get() as any;
        const totalOura = db
          .prepare(`SELECT COUNT(*) as count FROM oura_daily`)
          .get() as any;
        const byCategory = db
          .prepare(
            `SELECT category, COUNT(*) as count FROM log_entries GROUP BY category ORDER BY count DESC`
          )
          .all();
        const firstEntry = db
          .prepare(
            `SELECT MIN(logged_at) as first FROM log_entries`
          )
          .get() as any;
        const activeGoals = db
          .prepare(
            `SELECT COUNT(*) as count FROM goals WHERE telegram_user_id = ? AND active = 1`
          )
          .get(params.telegram_user_id) as any;

        return {
          text: "Database stats",
          total_log_entries: totalLogs.count,
          total_oura_days: totalOura.count,
          entries_by_category: byCategory,
          tracking_since: firstEntry.first,
          active_goals: activeGoals.count,
        };
      }

      case "snooze_nudges": {
        const hours = params.snooze_hours || 4;
        db.prepare(
          `INSERT INTO nudge_log (telegram_user_id, nudge_type, snoozed_until)
           VALUES (?, 'all', datetime('now', ?))`
        ).run(params.telegram_user_id, `+${hours} hours`);
        return { text: `Nudges snoozed for ${hours} hours` };
      }

      case "mute_nudges": {
        db.prepare(
          `INSERT INTO nudge_log (telegram_user_id, nudge_type, muted)
           VALUES (?, 'all', 1)`
        ).run(params.telegram_user_id);
        return { text: "Nudges muted. Say 'unmute nudges' to re-enable." };
      }

      case "unmute_nudges": {
        db.prepare(
          `DELETE FROM nudge_log WHERE telegram_user_id = ? AND muted = 1`
        ).run(params.telegram_user_id);
        return { text: "Nudges unmuted" };
      }

      default:
        return { text: "Unknown admin action", error: true };
    }
  },
};
