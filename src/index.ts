import { logEntryTool } from "./tools/log-entry.js";
import { queryLogsTool } from "./tools/query-logs.js";
import { insightsTool } from "./tools/insights.js";
import { manageGoalsTool } from "./tools/goals.js";
import { adminTool } from "./tools/admin.js";
import { ouraSyncTool } from "./tools/oura-sync.js";
import { nudgeCheckTool } from "./tools/nudge-check.js";
import { getDb } from "./db.js";

// OpenClaw plugin entry point
export default function (api: any) {
  // Initialize the database on plugin load
  getDb();

  // Register all agent tools
  api.registerTool(logEntryTool);
  api.registerTool(queryLogsTool);
  api.registerTool(insightsTool);
  api.registerTool(manageGoalsTool);
  api.registerTool(adminTool);
  api.registerTool(ouraSyncTool);
  api.registerTool(nudgeCheckTool);

  // Register a simple status command (auto-reply, no AI needed)
  api.registerCommand({
    name: "wellness-status",
    description: "Quick wellness database stats",
    handler: () => {
      const db = getDb();
      const logs = db
        .prepare(`SELECT COUNT(*) as c FROM log_entries`)
        .get() as any;
      const oura = db
        .prepare(`SELECT COUNT(*) as c FROM oura_daily`)
        .get() as any;
      const goals = db
        .prepare(`SELECT COUNT(*) as c FROM goals WHERE active = 1`)
        .get() as any;
      const latest = db
        .prepare(
          `SELECT category, subcategory, logged_at FROM log_entries ORDER BY logged_at DESC LIMIT 1`
        )
        .get() as any;

      return {
        text: [
          `📊 WellnessClaw Status`,
          `Logs: ${logs.c} entries`,
          `Oura: ${oura.c} days synced`,
          `Goals: ${goals.c} active`,
          latest
            ? `Last entry: ${latest.category}${latest.subcategory ? ` (${latest.subcategory})` : ""} @ ${latest.logged_at}`
            : `No entries yet — just text me what you did!`,
        ].join("\n"),
      };
    },
  });

  console.log("[WellnessClaw] Plugin loaded — tools registered, database ready.");
}
