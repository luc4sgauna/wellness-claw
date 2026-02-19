import { logEntryTool } from "./tools/log-entry.js";
import { queryLogsTool } from "./tools/query-logs.js";
import { insightsTool } from "./tools/insights.js";
import { manageGoalsTool } from "./tools/goals.js";
import { adminTool } from "./tools/admin.js";
import { ouraSyncTool } from "./tools/oura-sync.js";
import { getDb } from "./db.js";

export default function wellnessClaw(api: any) {
  // Initialize the database on plugin load
  getDb();

  // Register all agent tools
  api.registerTool(logEntryTool);
  api.registerTool(queryLogsTool);
  api.registerTool(insightsTool);
  api.registerTool(manageGoalsTool);
  api.registerTool(adminTool);
  api.registerTool(ouraSyncTool);

  console.log("[WellnessClaw] Plugin loaded — tools registered, database ready.");
}
