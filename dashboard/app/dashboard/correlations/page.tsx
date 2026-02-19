"use client";

import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";

type CorrelationType = "stress_vs_sleep" | "alcohol_vs_hrv" | "exercise_vs_readiness" | "sleep_levers";

const tabs: { key: CorrelationType; label: string }[] = [
  { key: "stress_vs_sleep", label: "Stress vs Sleep" },
  { key: "alcohol_vs_hrv", label: "Alcohol vs HRV" },
  { key: "exercise_vs_readiness", label: "Exercise vs Readiness" },
  { key: "sleep_levers", label: "Sleep Levers" },
];

function round(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Math.round(n * 10) / 10 + "";
}

export default function CorrelationsPage() {
  const [activeTab, setActiveTab] = useState<CorrelationType>("stress_vs_sleep");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    fetch(`/api/data/correlations?type=${activeTab}&days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load correlations"));
  }, [activeTab, days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Correlations</h2>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {!data && !error && <p className="text-gray-400">Loading...</p>}

      {data && activeTab === "stress_vs_sleep" && <StressVsSleep data={data} />}
      {data && activeTab === "alcohol_vs_hrv" && <AlcoholVsHrv data={data} />}
      {data && activeTab === "exercise_vs_readiness" && <ExerciseVsReadiness data={data} />}
      {data && activeTab === "sleep_levers" && <SleepLevers data={data} />}
    </div>
  );
}

function StressVsSleep({ data }: { data: Record<string, unknown> }) {
  const afterStress = data.afterStress as Record<string, number | null> | undefined;
  const noStress = data.noStress as Record<string, number | null> | undefined;

  const comparison = [
    { metric: "Sleep Score", withFactor: afterStress?.avg_sleep, without: noStress?.avg_sleep },
    { metric: "HRV (ms)", withFactor: afterStress?.avg_hrv, without: noStress?.avg_hrv },
    { metric: "Deep Sleep (min)", withFactor: afterStress?.avg_deep, without: noStress?.avg_deep },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Sample size: {data.sampleSize as number} stress entries</p>
      <ComparisonBars data={comparison} label1="After Stress" label2="No Stress" />
    </div>
  );
}

function AlcoholVsHrv({ data }: { data: Record<string, unknown> }) {
  const after = data.afterAlcohol as Record<string, number | null> | undefined;
  const no = data.noAlcohol as Record<string, number | null> | undefined;

  const comparison = [
    { metric: "HRV (ms)", withFactor: after?.avg_hrv, without: no?.avg_hrv },
    { metric: "Resting HR", withFactor: after?.avg_rhr, without: no?.avg_rhr },
    { metric: "Deep Sleep (min)", withFactor: after?.avg_deep, without: no?.avg_deep },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Sample size: {data.sampleSize as number} drinking entries</p>
      <ComparisonBars data={comparison} label1="After Alcohol" label2="No Alcohol" />
    </div>
  );
}

function ExerciseVsReadiness({ data }: { data: Record<string, unknown> }) {
  const detail = (data.detail || []) as {
    exercise_type: string;
    duration_min: number;
    readiness_score: number | null;
  }[];

  const scatterData = detail
    .filter((d) => d.readiness_score !== null)
    .map((d) => ({
      x: d.duration_min,
      y: d.readiness_score,
      type: d.exercise_type,
    }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Sample size: {data.sampleSize as number} exercise entries
      </p>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Duration vs Next-Day Readiness</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="x" name="Duration (min)" stroke="#6b7280" fontSize={12} />
            <YAxis dataKey="y" name="Readiness" stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
            />
            <Scatter data={scatterData} fill="#818cf8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SleepLevers({ data }: { data: Record<string, unknown> }) {
  const good = (data.beforeGoodSleep || []) as { category: string; subcategory: string | null; count: number; avg_value: number }[];
  const bad = (data.beforeBadSleep || []) as { category: string; subcategory: string | null; count: number; avg_value: number }[];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Sleep threshold: {data.threshold as number} | Nights analyzed: {data.totalNights as number}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-green-400 mb-3">Before Good Sleep</h3>
          {good.length === 0 ? (
            <p className="text-gray-500 text-sm">No data</p>
          ) : (
            <div className="space-y-2">
              {good.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {item.category}{item.subcategory ? ` / ${item.subcategory}` : ""}
                  </span>
                  <span className="text-gray-400">{item.count}x (avg {round(item.avg_value)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-red-400 mb-3">Before Bad Sleep</h3>
          {bad.length === 0 ? (
            <p className="text-gray-500 text-sm">No data</p>
          ) : (
            <div className="space-y-2">
              {bad.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {item.category}{item.subcategory ? ` / ${item.subcategory}` : ""}
                  </span>
                  <span className="text-gray-400">{item.count}x (avg {round(item.avg_value)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonBars({
  data,
  label1,
  label2,
}: {
  data: { metric: string; withFactor: number | null | undefined; without: number | null | undefined }[];
  label1: string;
  label2: string;
}) {
  const chartData = data.map((d) => ({
    metric: d.metric,
    [label1]: d.withFactor !== null && d.withFactor !== undefined ? Math.round(d.withFactor * 10) / 10 : 0,
    [label2]: d.without !== null && d.without !== undefined ? Math.round(d.without * 10) / 10 : 0,
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#6b7280" fontSize={12} />
          <YAxis dataKey="metric" type="category" stroke="#6b7280" fontSize={12} width={120} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
          />
          <Legend />
          <Bar dataKey={label1} fill="#f87171" radius={[0, 4, 4, 0]} />
          <Bar dataKey={label2} fill="#34d399" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
