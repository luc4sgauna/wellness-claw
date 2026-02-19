"use client";

interface DateRangePickerProps {
  value: number;
  onChange: (days: number) => void;
  options?: number[];
}

export function DateRangePicker({
  value,
  onChange,
  options = [7, 14, 30, 60, 90],
}: DateRangePickerProps) {
  return (
    <div className="flex gap-1">
      {options.map((days) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            value === days
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}
