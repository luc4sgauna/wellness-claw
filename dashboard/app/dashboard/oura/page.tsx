"use client";

import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface OuraDay {
  date: string;
  sleep_score: number | null;
  readiness_score: number | null;
  activity_score: number | null;
  hrv_average: number | null;
  resting_hr: number | null;
  total_sleep_minutes: number | null;
  deep_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  steps: number | null;
  bedtime_start: string | null;
  bedtime_end: string | null;
}

function formatDate(d: string) {
  return d.slice(5); // MM-DD
}

function bedtimeToMinutes(bt: string | null): number | null {
  if (!bt) return null;
  const d = new Date(bt);
  let h = d.getHours();
  const m = d.getMinutes();
  // Normalize: if before noon, add 24 (next day)
  if (h < 12) h += 24;
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  let h = Math.floor(min / 60);
  if (h >= 24) h -= 24;
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function OuraPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<OuraDay[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/data/oura?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load Oura data"));
  }, [days]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (data.length === 0) return <p className="text-gray-500">No Oura data available.</p>;

  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
    light_sleep:
      d.total_sleep_minutes && d.deep_sleep_minutes && d.rem_sleep_minutes
        ? d.total_sleep_minutes - d.deep_sleep_minutes - d.rem_sleep_minutes
        : null,
    bedtime_min: bedtimeToMinutes(d.bedtime_start),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Oura Trends</h2>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {/* Scores */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Scores (0-100)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
            />
            <Legend />
            <Line type="monotone" dataKey="sleep_score" stroke="#818cf8" name="Sleep" dot={false} connectNulls />
            <Line type="monotone" dataKey="readiness_score" stroke="#34d399" name="Readiness" dot={false} connectNulls />
            <Line type="monotone" dataKey="activity_score" stroke="#fbbf24" name="Activity" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* HRV & Resting HR */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">HRV & Resting HR</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
            <YAxis yAxisId="hrv" stroke="#818cf8" fontSize={12} />
            <YAxis yAxisId="hr" orientation="right" stroke="#f87171" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
            />
            <Legend />
            <Line yAxisId="hrv" type="monotone" dataKey="hrv_average" stroke="#818cf8" name="HRV (ms)" dot={false} connectNulls />
            <Line yAxisId="hr" type="monotone" dataKey="resting_hr" stroke="#f87171" name="Resting HR (bpm)" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep Composition */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Sleep Composition (minutes)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
            />
            <Legend />
            <Area type="monotone" dataKey="deep_sleep_minutes" stackId="1" stroke="#6366f1" fill="#6366f1" name="Deep" connectNulls />
            <Area type="monotone" dataKey="rem_sleep_minutes" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="REM" connectNulls />
            <Area type="monotone" dataKey="light_sleep" stackId="1" stroke="#a78bfa" fill="#a78bfa" name="Light" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Steps */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Steps</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
            />
            <Bar dataKey="steps" fill="#34d399" name="Steps" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bedtime Consistency */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Bedtime Consistency</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData.filter((d) => d.bedtime_min !== null)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(v) => minutesToTime(v)}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              formatter={(value: number) => minutesToTime(value)}
            />
            <Line type="monotone" dataKey="bedtime_min" stroke="#818cf8" name="Bedtime" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
