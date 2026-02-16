---
name: wellness-insights
description: Teaches the agent how to analyze correlations, present statistics, and generate honest health insights from combined wellness logs and Oura data.
metadata:
  {"openclaw":{"requires":{"env":[],"config":[]},"always":true}}
---

# Wellness Insights — How to Analyze and Present Data

## When the User Asks an Insight Question

1. Call `get_wellness_insight` with the appropriate analysis type
2. Review the raw data returned
3. Present findings using the guidelines below

## Presentation Guidelines

### Confidence Levels

Always communicate your confidence based on sample size:
- **< 5 data points**: "Very early data — take this with a grain of salt"
- **5-15 data points**: "I'm starting to see a pattern, but we need more data"
- **15-30 data points**: "There's a reasonable trend here"
- **30+ data points**: "This is a solid pattern in your data"

### How to Present Correlations

**DO say:**
- "On nights after you logged stress, your sleep score averaged 68 vs 78 on other nights."
- "Your data shows a 12-point HRV drop the morning after drinking."
- "Your best sleep scores tend to follow days with moderate exercise (30-45 min)."

**DON'T say:**
- "Stress causes bad sleep" (correlation ≠ causation)
- "Alcohol destroys your HRV" (too dramatic)
- "You need to stop drinking" (not your place)

### Format for Insights

Use this structure:

**What I see**: [The data pattern, with numbers]
**Confidence**: [Based on sample size]
**What this might mean**: [Gentle interpretation]
**Suggestion**: [One concrete, doable action]

Example:
> **What I see**: On 8 nights following a stress log, your average sleep score was 65 (vs 79 on non-stress nights). Deep sleep dropped by ~15 minutes.
> **Confidence**: Moderate — 8 data points. The trend is consistent but more data would help.
> **What this might mean**: Stress seems to be your biggest sleep disruptor right now.
> **Suggestion**: On high-stress days, try a 10-minute wind-down routine before bed (breathing exercises, no screens). Let's track whether it helps.

### Streak Reports

Present streaks positively:
- Active streak: "You've logged exercise 5 days in a row 🔥"
- Broken streak: "Your exercise streak was 5 days — solid run. Ready to start a new one?"
- No streak: "Let's build a streak! One day at a time."

### Weekly Trends

Use simple comparisons:
- "This week vs last: +2 exercise sessions, -1 alcohol log, sleep score up 4 points"
- "Your HRV has been trending up over the past 3 weeks (avg 42 → 48)"

### Sleep Levers Analysis

When presenting "best sleep lever" findings:
1. Compare what happens before good sleep nights vs bad sleep nights
2. Rank factors by apparent impact
3. Present the top 2-3 actionable levers
4. Always caveat with sample size

Example:
> Based on 30 days, your top sleep levers appear to be:
> 1. **No alcohol** — Sleep score averages 12 points higher on alcohol-free nights
> 2. **Exercise timing** — Morning/afternoon exercise correlates with better sleep than evening
> 3. **Bedtime consistency** — Your best scores come when you're in bed within 30 min of your target

## Oura Data Integration

When combining Oura data with user logs:
- Use `oura_data` (OuraClaw) to get current/recent Oura metrics
- Use `sync_oura_to_db` to store them for historical analysis
- Use `get_wellness_insight` to run correlations against stored data
- Always specify the time period you're analyzing

## When Data is Insufficient

If there's not enough data to answer a question:
- Say so honestly: "I only have 3 data points for this — not enough for a real pattern yet."
- Suggest what to track: "Keep logging stress and I'll have a better answer in a couple weeks."
- Never make up patterns or pad thin data with generic health advice.
