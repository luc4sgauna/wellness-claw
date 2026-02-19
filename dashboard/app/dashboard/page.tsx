"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";

interface Stats {
  totalEntries: number;
  ouraDays: number;
  activeGoals: number;
  thisWeekEntries: number;
  categories: { category: string; count: number }[];
  latestOura: {
    date: string;
    sleep_score: number | null;
    readiness_score: number | null;
    activity_score: number | null;
    hrv_average: number | null;
    resting_hr: number | null;
    steps: number | null;
  } | null;
  recentEntries: {
    id: number;
    category: string;
    subcategory: string | null;
    value: number | null;
    unit: string | null;
    notes: string | null;
    logged_at: string;
  }[];
}

const categoryColors: Record<string, string> = {
  exercise: "bg-green-500/20 text-green-400",
  stress: "bg-red-500/20 text-red-400",
  alcohol: "bg-amber-500/20 text-amber-400",
  sleep: "bg-blue-500/20 text-blue-400",
  mood: "bg-purple-500/20 text-purple-400",
  nutrition: "bg-orange-500/20 text-orange-400",
  hydration: "bg-cyan-500/20 text-cyan-400",
  reading: "bg-yellow-500/20 text-yellow-400",
  mindfulness: "bg-teal-500/20 text-teal-400",
  recovery: "bg-pink-500/20 text-pink-400",
};

function getScoreColor(score: number | null): string {
  if (score === null) return "text-gray-500";
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  return "text-red-400";
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/data/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setError("Failed to load stats"));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Entries" value={stats.totalEntries} />
        <StatCard label="Oura Days" value={stats.ouraDays} />
        <StatCard label="Active Goals" value={stats.activeGoals} />
        <StatCard label="This Week" value={stats.thisWeekEntries} subtitle="entries" />
      </div>

      {stats.latestOura && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Latest Oura Scores</h3>
          <p className="text-xs text-gray-500 mb-2">{stats.latestOura.date}</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Sleep"
              value={stats.latestOura.sleep_score ?? "—"}
              color={getScoreColor(stats.latestOura.sleep_score)}
            />
            <StatCard
              label="Readiness"
              value={stats.latestOura.readiness_score ?? "—"}
              color={getScoreColor(stats.latestOura.readiness_score)}
            />
            <StatCard
              label="Activity"
              value={stats.latestOura.activity_score ?? "—"}
              color={getScoreColor(stats.latestOura.activity_score)}
            />
            <StatCard
              label="HRV"
              value={stats.latestOura.hrv_average ? `${Math.round(stats.latestOura.hrv_average)} ms` : "—"}
            />
            <StatCard
              label="Resting HR"
              value={stats.latestOura.resting_hr ? `${Math.round(stats.latestOura.resting_hr)} bpm` : "—"}
            />
            <StatCard
              label="Steps"
              value={stats.latestOura.steps?.toLocaleString() ?? "—"}
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        {stats.recentEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center gap-3"
              >
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    categoryColors[entry.category] || "bg-gray-700 text-gray-300"
                  }`}
                >
                  {entry.category}
                </span>
                {entry.subcategory && (
                  <span className="text-sm text-gray-400">{entry.subcategory}</span>
                )}
                {entry.value !== null && (
                  <span className="text-sm text-white font-medium">
                    {entry.value}
                    {entry.unit ? ` ${entry.unit}` : ""}
                  </span>
                )}
                {entry.notes && (
                  <span className="text-sm text-gray-500 truncate">{entry.notes}</span>
                )}
                <span className="ml-auto text-xs text-gray-600">
                  {entry.logged_at.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
