```
┌─────────────────────────────────────────────────────────────────────┐
│                        Fly.io  (iad region)                        │
│                  shared-cpu-2x · 2GB RAM · $10-15/mo               │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   OpenClaw Gateway (v2026.2.15)               │  │
│  │                        port 3000 (WS)                        │  │
│  │                                                              │  │
│  │  ┌─────────────────┐              ┌────────────────────────┐  │  │
│  │  │  Telegram Plugin │              │     WellnessClaw       │  │  │
│  │  │                 │              │       (v1.0.0)         │  │  │
│  │  │  Bot polling    │              │                        │  │  │
│  │  │  DM + groups    │              │  5 tools:              │  │  │
│  │  └────────┬────────┘              │  log_entry             │  │  │
│  │           │                      │  query_logs            │  │  │
│  │           │                      │  insights              │  │  │
│  │  ┌────────┴──────────────────┐   │  goals                 │  │  │
│  │  │  Cron Scheduler (1 job)   │   │  admin                 │  │  │
│  │  │  ┌─────────────────────┐  │   └──────────┬─────────────┘  │  │
│  │  │  │ 09:30 ET  Oura Sync │  │              │               │  │
│  │  │  └─────────────────────┘  │              │               │  │
│  │  └───────────────────────────┘              │               │  │
│  │                                             │               │  │
│  │  ┌──────────────────────────────────────────┘               │  │
│  │  │  In-house Oura sync (src/jobs/oura-sync-job.ts)          │  │
│  │  │  Fetches via PAT · writes to oura_daily                  │  │
│  │  └──────────────────────────────────────────────────────────┘  │
│  │                                                              │  │
│  │  Agent: Claude Opus 4.6 (Anthropic API)                      │  │
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
│  │  cron/jobs.json         1 scheduled job (Oura sync 9:30 ET)  │  │
│  │  extensions/                                                 │  │
│  │    └── wellness-claw/   Plugin code + dist                   │  │
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
          │ (long-poll)        │ (PAT)                 │ (claude-opus-4-6)
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
