import DateRangePicker, { DateRange } from './DateRangePicker';

interface AnalyticsHeaderProps {
  title: string;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export default function AnalyticsHeader({ title, dateRange, onDateRangeChange }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
