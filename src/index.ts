import cron from "node-cron";
import { logEntryTool } from "./tools/log-entry.js";
import { queryLogsTool } from "./tools/query-logs.js";
import { insightsTool } from "./tools/insights.js";
import { manageGoalsTool } from "./tools/goals.js";
import { adminTool } from "./tools/admin.js";
import { getDb } from "./db.js";
import { runOuraSync } from "./jobs/oura-sync-job.js";

export default function wellnessClaw(api: any) {
  // Initialize the database on plugin load
  getDb();

  // Register all agent tools
  api.registerTool(logEntryTool);
  api.registerTool(queryLogsTool);
  api.registerTool(insightsTool);
  api.registerTool(manageGoalsTool);
  api.registerTool(adminTool);

  // Sync Oura data once on startup (backfill if just deployed)
  runOuraSync().catch((err) => console.error("[OuraSync] Startup sync failed:", err));

  // Schedule daily sync at 9:30am ET (Oura finishes computing overnight data by then)
  cron.schedule("30 9 * * *", () => {
    runOuraSync().catch((err) => console.error("[OuraSync] Scheduled sync failed:", err));
  }, { timezone: "America/New_York" });

  console.log("[WellnessClaw] Plugin loaded — tools registered, database ready, Oura sync scheduled.");
}
