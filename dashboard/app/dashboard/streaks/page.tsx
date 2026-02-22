"use client";

import { useEffect, useState, useRef } from "react";

interface StreakInfo {
  name: string;
  key: string;
  currentStreak: number;
  longestStreak: number;
  total90d: number;
  dates: string[];
}

const streakColors: Record<string, string> = {
  alcohol: "#fbbf24",
  steps: "#818cf8",
  activity: "#fb923c",
  protein: "#f87171",
  reading: "#facc15",
  stress: "#f43f5e",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function Heatmap({ dates, color }: { dates: string[]; color: string }) {
  const dateSet = new Set(dates);
  const today = new Date();
  const cells: { date: string; active: boolean }[] = [];
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    cells.push({ date: ds, active: dateSet.has(ds) });
  }

  const cols = 13;
  const rows = 7;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={cols * 14}
        height={rows * 14}
        className="mt-2"
        onMouseLeave={() => setTooltip(null)}
      >
        {cells.map((cell, i) => {
          const col = Math.floor(i / rows);
          const row = i % rows;
          return (
            <rect
              key={cell.date}
              x={col * 14}
              y={row * 14}
              width={12}
              height={12}
              rx={2}
              fill={cell.active ? color : "#1f2937"}
              opacity={cell.active ? 0.9 : 0.3}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const svgRect = svgRef.current?.getBoundingClientRect();
                if (svgRect) {
                  setTooltip({
                    text: formatDate(cell.date),
                    x: rect.left - svgRect.left + 6,
                    y: rect.top - svgRect.top - 28,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

export default function StreaksPage() {
  const [streaks, setStreaks] = useState<StreakInfo[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/data/streaks")
      .then((r) => r.json())
      .then(setStreaks)
      .catch(() => setError("Failed to load streaks"));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Streaks</h2>

      {streaks.length === 0 ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {streaks.map((streak) => (
            <div
              key={streak.key}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white">{streak.name}</h3>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">
                    {streak.total90d}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">days (90d)</span>
                </div>
              </div>

              <div className="flex gap-6 text-sm text-gray-400 mb-3">
                <span>Current: {streak.currentStreak}d</span>
                <span>Longest: {streak.longestStreak}d</span>
              </div>

              <Heatmap
                dates={streak.dates}
                color={streakColors[streak.key] || "#818cf8"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
