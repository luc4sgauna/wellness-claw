"use client";

import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";

interface LogEntry {
  id: number;
  category: string;
  subcategory: string | null;
  value: number | null;
  unit: string | null;
  notes: string | null;
  logged_at: string;
}

const categoryColors: Record<string, string> = {
  exercise: "bg-green-500/20 text-green-400 border-green-500/30",
  stress: "bg-red-500/20 text-red-400 border-red-500/30",
  alcohol: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  sleep: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  mood: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  nutrition: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  hydration: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  reading: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  mindfulness: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  recovery: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function TimelinePage() {
  const [days, setDays] = useState(7);
  const [grouped, setGrouped] = useState<Record<string, LogEntry[]>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/data/timeline?days=${days}`)
      .then((r) => r.json())
      .then(setGrouped)
      .catch(() => setError("Failed to load timeline"));
  }, [days]);

  if (error) return <p className="text-red-400">{error}</p>;

  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Timeline</h2>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {dates.length === 0 ? (
        <p className="text-gray-500">No entries in this range.</p>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-400 mb-2">{date}</h3>
              <div className="space-y-2">
                {grouped[date].map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3"
                  >
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        categoryColors[entry.category] || "bg-gray-700 text-gray-300 border-gray-600"
                      }`}
                    >
                      {entry.category}
                    </span>
                    {entry.subcategory && (
                      <span className="text-sm text-gray-300">{entry.subcategory}</span>
                    )}
                    {entry.value !== null && (
                      <span className="text-sm text-white font-medium">
                        {entry.value}{entry.unit ? ` ${entry.unit}` : ""}
                      </span>
                    )}
                    {entry.notes && (
                      <span className="text-sm text-gray-500">{entry.notes}</span>
                    )}
                    <span className="ml-auto text-xs text-gray-600">
                      {entry.logged_at.split(" ")[1]?.slice(0, 5) || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
