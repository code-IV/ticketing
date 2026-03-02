"use client";

import { subDays } from 'date-fns';

type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const ranges = [
    {
      label: 'Last 7 days',
      start: subDays(new Date(), 7),
      end: new Date(),
    },
    {
      label: 'Last 3 months',
      start: subDays(new Date(), 90),
      end: new Date(),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value.label}
        onChange={(e) => {
          const selected = ranges.find(r => r.label === e.target.value);
          if (selected) onChange(selected);
        }}
      >
        {ranges.map(range => (
          <option key={range.label} value={range.label}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export type { DateRange };
