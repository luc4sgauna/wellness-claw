# WellnessClaw

A conversational wellness assistant plugin for [OpenClaw](https://openclaw.ai/). Text your Telegram bot naturally — it logs, analyzes, and coaches you using your Oura Ring data.

## What It Does

- **Passive logging**: Text "45 min HIIT" or "stressful day" — it auto-classifies and stores structured data
- **Oura insights**: Ask "How does stress affect my sleep?" — it runs correlations against your Oura data
- **Proactive coaching**: Morning readiness plans, afternoon movement nudges, evening wind-down reminders
- **Goals + accountability**: Set targets, track streaks, get gentle progress updates
- **Admin controls**: Delete entries, export data (CSV/JSON), snooze/mute nudges

## Prerequisites

You need these already working:
1. [OpenClaw](https://openclaw.ai/) installed and running
2. Telegram channel connected in OpenClaw
3. [OuraClaw](https://github.com/rickybloomfield/OuraClaw) plugin installed and authorized

## Install

```bash
# 1. Clone this repo into your OpenClaw extensions directory
cd ~/.openclaw/extensions
git clone https://github.com/YOUR_USERNAME/wellness-claw.git

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
          timezone: "America/New_York",  // your timezone
          nudgesPerDay: 3
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

## Set Up Cron Jobs (Proactive Nudges)

```bash
# Morning readiness briefing at 7 AM
openclaw cron add \
  --name "wellness-morning" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Morning wellness check: Fetch today's Oura readiness and sleep data. Store it with sync_oura_to_db. Check my goals. Send me a brief morning plan based on my readiness score. Remember to call check_nudge_status first." \
  --announce \
  --channel telegram

# Afternoon movement nudge at 2 PM
openclaw cron add \
  --name "wellness-afternoon" \
  --cron "0 14 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Afternoon wellness check: Check my step count and activity from Oura. Check if I logged any exercise today. If I'm behind on movement, send a gentle nudge. Remember to call check_nudge_status first." \
  --announce \
  --channel telegram

# Evening wind-down at 9 PM
openclaw cron add \
  --name "wellness-evening" \
  --cron "0 21 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Evening wellness check: Check my bedtime goal and today's logs. If I logged stress or alcohol today, factor that in. Send a brief wind-down reminder. Remember to call check_nudge_status first." \
  --announce \
  --channel telegram

# Oura daily sync at midnight (backup — OuraClaw also syncs)
openclaw cron add \
  --name "wellness-oura-sync" \
  --cron "0 0 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Nightly Oura sync: Fetch today's complete Oura data (sleep, readiness, activity, HRV, steps). Store everything with sync_oura_to_db. No need to message me — just sync silently." \
  --delivery none
```

## Usage

Just text your Telegram bot naturally:

| You say | What happens |
|---------|-------------|
| "45 min HIIT" | Logs exercise (HIIT, 45 min) |
| "stressful day" | Logs stress |
| "2 glasses of wine" | Logs alcohol (wine, 2 drinks) |
| "going to bed" | Logs bedtime |
| "How does stress affect my sleep?" | Runs stress vs sleep correlation |
| "What patterns with alcohol and HRV?" | Runs alcohol vs HRV analysis |
| "Best sleep lever for me?" | Analyzes what behaviors improve your sleep |
| "Set sleep target to 10:30pm" | Creates a bedtime goal |
| "What are my goals?" | Shows all active goals |
| "Delete last entry" | Removes the most recent log |
| "Export my data" | Exports everything to JSON |
| "Snooze nudges 2 hours" | Pauses proactive messages |
| "Mute notifications" | Stops all nudges until unmuted |

## Deploy to Fly.io (Always-On)

For proactive nudges to work 24/7, deploy OpenClaw to Fly.io:

```bash
# Follow the OpenClaw Fly.io guide: https://docs.openclaw.ai/install/fly.md
# Your wellness-claw plugin goes in the persistent volume at /data/.openclaw/extensions/

# Set secrets
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy
fly deploy
```

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
├── src/
│   ├── index.ts            # Plugin entry — registers all tools
│   ├── db.ts               # SQLite database setup + migrations
│   └── tools/
│       ├── log-entry.ts    # Passive logging tool
│       ├── query-logs.ts   # Query historical logs
│       ├── insights.ts     # Correlation analysis engine
│       ├── goals.ts        # Goals CRUD
│       ├── admin.ts        # Delete, export, snooze, stats
│       ├── oura-sync.ts    # Store Oura data for analysis
│       └── nudge-check.ts  # Rate limiting for proactive nudges
├── skills/
│   ├── wellness-router/    # Message classification + routing
│   ├── wellness-coach/     # Coaching personality + nudge behavior
│   └── wellness-insights/  # How to analyze and present data
├── HEARTBEAT.md            # Proactive coaching checklist
└── README.md
```

## License

MIT
