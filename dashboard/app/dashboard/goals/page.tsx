"use client";

import { useEffect, useState } from "react";

interface GoalInfo {
  id: number;
  goal_type: string;
  target_value: string;
  created_at: string;
  current_value: number | null;
  pct: number;
}

const goalTypeLabels: Record<string, string> = {
  sleep_window: "Sleep Window",
  training_frequency: "Training Frequency",
  daily_steps: "Daily Steps",
  weight_target: "Weight Target",
  hydration: "Hydration",
  bedtime: "Bedtime",
  wake_time: "Wake Time",
  alcohol_limit: "Alcohol Limit",
  stress_management: "Stress Management",
};

function pctColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalInfo[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/data/goals")
      .then((r) => r.json())
      .then(setGoals)
      .catch(() => setError("Failed to load goals"));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Goals</h2>

      {goals.length === 0 ? (
        <p className="text-gray-500">No active goals. Set goals via the Telegram bot.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <h3 className="font-semibold text-white mb-1">
                {goalTypeLabels[goal.goal_type] || goal.goal_type}
              </h3>
              <p className="text-sm text-gray-400 mb-4">Target: {goal.target_value}</p>

              {goal.current_value !== null ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-white">{goal.current_value} lbs</span>
                    <span className="text-sm text-gray-400">{goal.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${pctColor(goal.pct)}`}
                      style={{ width: `${goal.pct}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">No progress logged yet</p>
              )}

              <p className="text-xs text-gray-600 mt-3">set {formatDate(goal.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
