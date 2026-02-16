import { getDb } from "../db.js";

export const insightsTool = {
  name: "get_wellness_insight",
  description: `Run a specific correlation or trend analysis combining wellness logs and Oura data.
Use this when the user asks questions like "how does stress affect my sleep?" or
"what patterns do you see with alcohol and HRV?" or "what's my best sleep lever?"
Returns raw data for you to interpret — present findings honestly and avoid overclaiming causation.`,
  schema: {
    type: "object",
    properties: {
      analysis_type: {
        type: "string",
        enum: [
          "stress_vs_sleep",
          "alcohol_vs_hrv",
          "exercise_vs_readiness",
          "sleep_levers",
          "weekly_trends",
          "streak_report",
          "custom_correlation",
        ],
        description: "The type of analysis to run",
      },
      days_back: {
        type: "number",
        description: "How many days to analyze (default: 30)",
        default: 30,
      },
      category_a: {
        type: "string",
        description: "First category for custom_correlation",
      },
      category_b: {
        type: "string",
        description: "Second category / Oura metric for custom_correlation",
      },
    },
    required: ["analysis_type"],
  },
  handler: async (params: {
    analysis_type: string;
    days_back?: number;
    category_a?: string;
    category_b?: string;
  }) => {
    const db = getDb();
    const days = params.days_back || 30;
    const since = `-${days} days`;

    switch (params.analysis_type) {
      case "stress_vs_sleep": {
        // Days with stress logs vs next-day sleep scores
        const data = db
          .prepare(
            `SELECT
              le.logged_at as stress_date,
              le.value as stress_level,
              le.notes,
              o_next.sleep_score,
              o_next.hrv_average,
              o_next.total_sleep_minutes,
              o_next.deep_sleep_minutes,
              o_next.date as sleep_date
            FROM log_entries le
            LEFT JOIN oura_daily o_next
              ON o_next.date = date(le.logged_at, '+1 day')
            WHERE le.category = 'stress'
              AND le.logged_at >= datetime('now', ?)
            ORDER BY le.logged_at`
          )
          .all(since);

        // Compare with non-stress days
        const avgWithStress = db
          .prepare(
            `SELECT AVG(o.sleep_score) as avg_sleep, AVG(o.hrv_average) as avg_hrv,
                    AVG(o.deep_sleep_minutes) as avg_deep
             FROM oura_daily o
             WHERE o.date IN (
               SELECT date(le.logged_at, '+1 day')
               FROM log_entries le WHERE le.category = 'stress'
                 AND le.logged_at >= datetime('now', ?)
             )`
          )
          .get(since);

        const avgWithoutStress = db
          .prepare(
            `SELECT AVG(o.sleep_score) as avg_sleep, AVG(o.hrv_average) as avg_hrv,
                    AVG(o.deep_sleep_minutes) as avg_deep
             FROM oura_daily o
             WHERE o.date >= date('now', ?)
               AND o.date NOT IN (
                 SELECT date(le.logged_at, '+1 day')
                 FROM log_entries le WHERE le.category = 'stress'
                   AND le.logged_at >= datetime('now', ?)
               )`
          )
          .get(since, since);

        return {
          text: `Stress vs Sleep analysis (${days} days)`,
          detail_data: data,
          after_stress: avgWithStress,
          no_stress: avgWithoutStress,
          sample_size: data.length,
          note: "Correlation only — present honestly. Small sample sizes = low confidence.",
        };
      }

      case "alcohol_vs_hrv": {
        const data = db
          .prepare(
            `SELECT
              le.logged_at as drink_date,
              le.value as drinks,
              le.subcategory as drink_type,
              o_next.hrv_average,
              o_next.resting_hr,
              o_next.sleep_score,
              o_next.deep_sleep_minutes,
              o_next.date as next_day
            FROM log_entries le
            LEFT JOIN oura_daily o_next
              ON o_next.date = date(le.logged_at, '+1 day')
            WHERE le.category = 'alcohol'
              AND le.logged_at >= datetime('now', ?)
            ORDER BY le.logged_at`
          )
          .all(since);

        const avgWithAlcohol = db
          .prepare(
            `SELECT AVG(o.hrv_average) as avg_hrv, AVG(o.resting_hr) as avg_rhr,
                    AVG(o.deep_sleep_minutes) as avg_deep
             FROM oura_daily o
             WHERE o.date IN (
               SELECT date(le.logged_at, '+1 day')
               FROM log_entries le WHERE le.category = 'alcohol'
                 AND le.logged_at >= datetime('now', ?)
             )`
          )
          .get(since);

        const avgWithoutAlcohol = db
          .prepare(
            `SELECT AVG(o.hrv_average) as avg_hrv, AVG(o.resting_hr) as avg_rhr,
                    AVG(o.deep_sleep_minutes) as avg_deep
             FROM oura_daily o
             WHERE o.date >= date('now', ?)
               AND o.date NOT IN (
                 SELECT date(le.logged_at, '+1 day')
                 FROM log_entries le WHERE le.category = 'alcohol'
                   AND le.logged_at >= datetime('now', ?)
               )`
          )
          .get(since, since);

        return {
          text: `Alcohol vs HRV analysis (${days} days)`,
          detail_data: data,
          after_alcohol: avgWithAlcohol,
          no_alcohol: avgWithoutAlcohol,
          sample_size: data.length,
          note: "Correlation only. More data = more reliable patterns.",
        };
      }

      case "exercise_vs_readiness": {
        const data = db
          .prepare(
            `SELECT
              le.logged_at as exercise_date,
              le.subcategory as exercise_type,
              le.value as duration_min,
              o_next.readiness_score,
              o_next.hrv_average,
              o_next.activity_score,
              o_next.date as next_day
            FROM log_entries le
            LEFT JOIN oura_daily o_next
              ON o_next.date = date(le.logged_at, '+1 day')
            WHERE le.category = 'exercise'
              AND le.logged_at >= datetime('now', ?)
            ORDER BY le.logged_at`
          )
          .all(since);

        return {
          text: `Exercise vs Readiness analysis (${days} days)`,
          data,
          sample_size: data.length,
        };
      }

      case "sleep_levers": {
        // Find what behaviors correlate with best sleep
        const sleepData = db
          .prepare(
            `SELECT o.date, o.sleep_score, o.hrv_average, o.deep_sleep_minutes,
                    o.total_sleep_minutes, o.bedtime_start, o.resting_hr
             FROM oura_daily o
             WHERE o.date >= date('now', ?)
             ORDER BY o.sleep_score DESC`
          )
          .all(since);

        // What happened the day before good sleep vs bad sleep
        const median =
          sleepData.length > 0
            ? sleepData[Math.floor(sleepData.length / 2)]
            : null;
        const threshold = median ? (median as any).sleep_score : 75;

        const beforeGoodSleep = db
          .prepare(
            `SELECT le.category, le.subcategory, COUNT(*) as count, AVG(le.value) as avg_value
             FROM log_entries le
             JOIN oura_daily o ON date(le.logged_at) = date(o.date, '-1 day')
             WHERE o.sleep_score >= ? AND o.date >= date('now', ?)
             GROUP BY le.category, le.subcategory
             ORDER BY count DESC`
          )
          .all(threshold, since);

        const beforeBadSleep = db
          .prepare(
            `SELECT le.category, le.subcategory, COUNT(*) as count, AVG(le.value) as avg_value
             FROM log_entries le
             JOIN oura_daily o ON date(le.logged_at) = date(o.date, '-1 day')
             WHERE o.sleep_score < ? AND o.date >= date('now', ?)
             GROUP BY le.category, le.subcategory
             ORDER BY count DESC`
          )
          .all(threshold, since);

        return {
          text: `Sleep levers analysis (${days} days)`,
          sleep_overview: {
            total_nights: sleepData.length,
            threshold_used: threshold,
          },
          before_good_sleep: beforeGoodSleep,
          before_bad_sleep: beforeBadSleep,
          all_sleep_data: sleepData,
        };
      }

      case "weekly_trends": {
        const weeks = db
          .prepare(
            `SELECT
              strftime('%Y-W%W', logged_at) as week,
              category,
              COUNT(*) as entries,
              AVG(value) as avg_value
            FROM log_entries
            WHERE logged_at >= datetime('now', ?)
            GROUP BY week, category
            ORDER BY week, category`
          )
          .all(since);

        const ouraWeeks = db
          .prepare(
            `SELECT
              strftime('%Y-W%W', date) as week,
              AVG(sleep_score) as avg_sleep,
              AVG(readiness_score) as avg_readiness,
              AVG(hrv_average) as avg_hrv,
              AVG(steps) as avg_steps
            FROM oura_daily
            WHERE date >= date('now', ?)
            GROUP BY week
            ORDER BY week`
          )
          .all(since);

        return {
          text: `Weekly trends (${days} days)`,
          log_trends: weeks,
          oura_trends: ouraWeeks,
        };
      }

      case "streak_report": {
        const categories = db
          .prepare(
            `SELECT DISTINCT category FROM log_entries
             WHERE logged_at >= datetime('now', '-90 days')`
          )
          .all() as { category: string }[];

        const streaks: Record<string, any> = {};
        for (const { category } of categories) {
          const dates = db
            .prepare(
              `SELECT DISTINCT date(logged_at) as d
               FROM log_entries
               WHERE category = ?
               ORDER BY d DESC`
            )
            .all(category) as { d: string }[];

          let currentStreak = 0;
          const today = new Date().toISOString().split("T")[0];
          let checkDate = new Date(today);

          for (const { d } of dates) {
            const entryDate = d;
            const expected = checkDate.toISOString().split("T")[0];
            if (entryDate === expected) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }

          streaks[category] = {
            current_streak_days: currentStreak,
            total_entries_90d: dates.length,
          };
        }

        return { text: "Streak report", streaks };
      }

      default:
        return { text: "Unknown analysis type", error: true };
    }
  },
};
