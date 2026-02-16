# Wellness Heartbeat Checklist

- Check if any nudge is due (morning readiness, afternoon movement, evening wind-down) based on current time.
- Before sending any nudge: call `check_nudge_status` — if not allowed, do nothing.
- If a morning nudge is due: fetch today's Oura data via `oura_data`, store it with `sync_oura_to_db`, then compose a brief readiness plan.
- If an afternoon nudge is due: check today's activity and logged exercise, nudge only if movement is low.
- If an evening nudge is due: check bedtime goal and today's logs, compose a brief wind-down reminder.
- If no nudge is due: reply HEARTBEAT_OK.
