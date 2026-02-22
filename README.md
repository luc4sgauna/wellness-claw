# WellnessClaw

A conversational wellness assistant plugin for [OpenClaw](https://openclaw.ai/). Text your Telegram bot naturally — it logs, analyzes, and tracks your wellness using your Oura Ring data. Includes a web dashboard for visualizing streaks, goals, and trends.

## What It Does

- **Passive logging**: Text "45 min HIIT" or "stressful day" — it auto-classifies and stores structured data
- **Oura insights**: Ask "How does stress affect my sleep?" — it runs correlations against your Oura data
- **Goals + accountability**: Set targets, track streaks, get gentle progress updates
- **Web dashboard**: View streaks, goals, Oura charts, and timeline at `https://wellness-openclaw.fly.dev`
- **Admin controls**: Delete entries, export data (CSV/JSON)

## Prerequisites

You need these already working:
1. [OpenClaw](https://openclaw.ai/) installed and running
2. Telegram channel connected in OpenClaw
3. An [Oura Personal Access Token](https://cloud.ouraring.com/personal-access-tokens) (no OAuth needed)

## Install

```bash
# 1. Clone this repo into your OpenClaw extensions directory
cd ~/.openclaw/extensions
git clone https://github.com/luc4sgauna/wellness-claw.git

# 2. Install dependencies and build
cd wellness-claw
npm install
npm run build

# 3. Enable the plugin in your OpenClaw config (~/.openclaw/openclaw.json)
```

Add to your `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "wellness-claw": {
        enabled: true,
        config: {
          timezone: "America/New_York"
        }
      }
    }
  }
}
```

```bash
# 4. Copy the skills to your workspace
cp -r skills/* ~/.openclaw/workspace/skills/

# 5. Copy the heartbeat checklist
cp HEARTBEAT.md ~/.openclaw/workspace/HEARTBEAT.md

# 6. Restart OpenClaw
openclaw gateway --port 18789 --verbose
```

## Usage

Just text your Telegram bot naturally:

| You say | What happens |
|---------|-------------|
| "45 min HIIT" | Logs exercise (HIIT, 45 min) |
| "stressful day" | Logs stress |
| "2 glasses of wine" | Logs alcohol (wine, 2 drinks) |
| "hit my protein goal" | Logs protein goal for the day |
| "read 30 pages" | Logs reading |
| "How does stress affect my sleep?" | Runs stress vs sleep correlation |
| "What patterns with alcohol and HRV?" | Runs alcohol vs HRV analysis |
| "Best sleep lever for me?" | Analyzes what behaviors improve your sleep |
| "Set sleep target to 10:30pm" | Creates a bedtime goal |
| "What are my goals?" | Shows all active goals |
| "Delete last entry" | Removes the most recent log |
| "Export my data" | Exports everything to JSON |

## Dashboard

The web dashboard runs alongside the OpenClaw gateway and provides:

- **Streaks**: Heatmap tracking for Alcohol, Steps (7k+), Activity (400+ cal), Protein Goal, and Reading
- **Goals**: Active goals with progress bars
- **Timeline**: Scrollable feed of all logged entries
- **Oura**: Charts for sleep scores, HRV, steps, and bedtime consistency

### Dashboard Streaks

| Streak | Data Source | Lights up when |
|--------|-----------|----------------|
| Alcohol | Bot log | You logged a drink that day |
| Steps (7k+) | Oura Ring | Steps >= 7,000 |
| Activity (400+ cal) | Oura Ring | Active calories >= 400 |
| Protein Goal | Bot log | You logged "hit protein" |
| Reading | Bot log | You logged any reading |

## Deploy to Fly.io

The project includes a Dockerfile and `fly.toml` for deployment. The dashboard is served on port 8080 (public) and the OpenClaw gateway runs on port 3000 (internal).

```bash
# Set secrets
fly secrets set DASHBOARD_PASSWORD=<your-password> -a wellness-openclaw
fly secrets set ANTHROPIC_API_KEY=sk-ant-... -a wellness-openclaw
fly secrets set OURA_PAT=<your-oura-personal-access-token> -a wellness-openclaw

# Deploy
fly deploy -a wellness-openclaw
```

The dashboard will be available at `https://wellness-openclaw.fly.dev`.

Oura data syncs automatically at startup and daily at 9:30am ET — no OAuth or OuraClaw needed.

## Data & Privacy

- All data stored locally in SQLite (`~/.openclaw/wellness-claw/wellness.db`)
- No data sent to third parties (beyond the LLM API for processing)
- Export anytime with "export my data"
- Delete anytime with "delete last entry" or "wipe [date range]"

## File Structure

```
wellness-claw/
├── openclaw.plugin.json    # Plugin manifest
├── package.json            # Dependencies
├── Dockerfile              # Multi-stage build (dashboard + plugin)
├── fly.toml                # Fly.io app config
├── entrypoint.sh           # Starts dashboard + gateway
├── src/
│   ├── index.ts            # Plugin entry — registers tools, schedules Oura sync
│   ├── db.ts               # SQLite database setup + migrations
│   ├── jobs/
│   │   └── oura-sync-job.ts  # Daily Oura sync via Personal Access Token
│   └── tools/
│       ├── log-entry.ts    # Passive logging tool
│       ├── query-logs.ts   # Query historical logs
│       ├── insights.ts     # Correlation analysis engine
│       ├── goals.ts        # Goals CRUD
│       └── admin.ts        # Delete, export, stats
├── dashboard/
│   ├── app/                # Next.js pages and API routes
│   ├── components/         # Sidebar, StatCard, DateRangePicker
│   ├── lib/                # Auth, DB connection, query modules
│   └── package.json
├── skills/
│   ├── wellness-router/    # Message classification + routing
│   ├── wellness-coach/     # Coaching personality + behavior
│   └── wellness-insights/  # How to analyze and present data
├── HEARTBEAT.md            # Heartbeat checklist
└── README.md
```

## License

MIT
