```
┌─────────────────────────────────────────────────────────────────────┐
│                        Fly.io  (iad region)                        │
│                  shared-cpu-2x · 2GB RAM · $10-15/mo               │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   OpenClaw Gateway (v2026.2.15)               │  │
│  │                        port 3000 (WS)                        │  │
│  │                                                              │  │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │  Telegram Plugin │  │   OuraClaw   │  │  WellnessClaw  │  │  │
│  │  │                 │  │   (v0.1.4)   │  │    (v1.0.0)    │  │  │
│  │  │  Bot polling    │  │              │  │                │  │  │
│  │  │  DM + groups    │  │  oura_data   │  │  7 tools:      │  │  │
│  │  └────────┬────────┘  └──────┬───────┘  │  log_entry     │  │  │
│  │           │                  │          │  query_logs    │  │  │
│  │           │                  │          │  insights      │  │  │
│  │  ┌────────┴──────────────────┘          │  goals         │  │  │
│  │  │  Cron Scheduler (4 jobs)             │  admin         │  │  │
│  │  │  ┌─────────────────────────────┐     │  oura_sync     │  │  │
│  │  │  │ 07:00  Morning Readiness    │     │  nudge_check   │  │  │
│  │  │  │ 14:00  Afternoon Movement   │     └───────┬────────┘  │  │
│  │  │  │ 21:30  Evening Wind-down    │             │           │  │
│  │  │  │ 00:00  Nightly Oura Sync    │             │           │  │
│  │  │  └─────────────────────────────┘             │           │  │
│  │  └──────────────────────────────────────────────┘           │  │
│  │                                                              │  │
│  │  Agent: Claude Opus 4.5 (Anthropic API)                      │  │
│  │  Skills: wellness-router → wellness-coach / wellness-insights │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Persistent Volume (1GB, encrypted)               │  │
│  │                        /data/.openclaw/                       │  │
│  │                                                              │  │
│  │  openclaw.json          Config (Telegram token, plugins)     │  │
│  │  agents/                Auth profiles (Anthropic API key)    │  │
│  │  credentials/           Telegram pairing + allowlist         │  │
│  │  devices/               Paired device tokens                 │  │
│  │  identity/              Gateway device identity              │  │
│  │  cron/jobs.json         4 scheduled jobs                     │  │
│  │  extensions/                                                 │  │
│  │    ├── wellness-claw/   Plugin code + dist                   │  │
│  │    └── ouraclaw/        Plugin code + dist                   │  │
│  │  plugins/OuraClaw/      Oura OAuth tokens (config.json)      │  │
│  │  wellness-claw/                                              │  │
│  │    └── wellness.db      SQLite (WAL mode)                    │  │
│  │  workspace/                                                  │  │
│  │    ├── HEARTBEAT.md     Agent heartbeat                      │  │
│  │    ├── SOUL.md          Agent personality                    │  │
│  │    └── skills/          3 wellness skills                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

          │                    │                       │
          │ Telegram API       │ Oura API              │ Anthropic API
          │ (long-poll)        │ (OAuth2)              │ (claude-opus-4-5)
          ▼                    ▼                       ▼

┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Telegram   │    │    Oura Cloud     │    │    Anthropic     │
│              │    │                  │    │                  │
│  User: Lucas │    │  Sleep, HRV,     │    │  Agent reasoning │
│  Bot: 8487.. │    │  Readiness,      │    │  Tool calls      │
│              │    │  Activity, Steps │    │  Nudge generation│
└──────────────┘    └──────────────────┘    └──────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         SQLite Schema                               │
│                     wellness-claw/wellness.db                       │
│                                                                     │
│  messages        Raw Telegram messages + intent classification      │
│  log_entries     Structured wellness logs (exercise, food, mood..)  │
│  oura_daily      Daily Oura summaries (sleep, HRV, steps, HR..)    │
│  goals           User goals (sleep window, steps, exercise..)       │
│  nudge_log       Rate limiting: 1 nudge per type per day            │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                       Skill Routing                                 │
│                                                                     │
│  User message → wellness-router (intent classification)             │
│                    │                                                │
│                    ├── LOG/QUERY/GOAL/ADMIN → tool calls directly   │
│                    ├── coaching needed → wellness-coach              │
│                    └── analysis needed → wellness-insights           │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     Local Dev (Mac)                                  │
│                                                                     │
│  ~/wellness-claw/          Plugin source (TypeScript)               │
│  ~/openclaw-fly/           Fly deployment config                    │
│  ~/.openclaw/              Local state (gateway stopped)            │
│                                                                     │
│  Repos:                                                             │
│    github.com/luc4sgauna/wellness-claw    (public)                  │
│    github.com/luc4sgauna/openclaw-fly     (private)                 │
└─────────────────────────────────────────────────────────────────────┘
```
