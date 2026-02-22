import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  initialPreset?: string;
}

interface DatePreset {
  id: string;
  label: string;
  days: number | null;
}

export function DateRangeFilter({ onDateRangeChange, initialPreset = '30days' }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const datePresets: DatePreset[] = [
    { id: 'today', label: 'Today', days: 0 },
    { id: '7days', label: 'Last 7 Days', days: 7 },
    { id: '30days', label: 'Last 30 Days', days: 30 },
    { id: '90days', label: 'Last 90 Days', days: 90 },
    { id: 'custom', label: 'Custom Range', days: null },
  ];

  useEffect(() => {
    applyDatePreset(initialPreset);
  }, [initialPreset]);

  const applyDatePreset = (presetId: string) => {
    const preset = datePresets.find(p => p.id === presetId);
    if (preset && preset.days !== null) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - preset.days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      setCustomStartDate(startDateStr);
      setCustomEndDate(endDateStr);
      onDateRangeChange(startDateStr, endDateStr);
    }
    setSelectedPreset(presetId);
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange(customStartDate, customEndDate);
    }
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId !== 'custom') {
      applyDatePreset(presetId);
    }
  };

  const isCustomRange = selectedPreset === 'custom';

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
        </div>
        
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {datePresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        
        {isCustomRange && (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                handleCustomDateChange();
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                handleCustomDateChange();
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="End date"
            />
          </div>
        )}
        
        {!isCustomRange && (
          <div className="text-sm text-gray-600">
            {datePresets.find(p => p.id === selectedPreset)?.label}
          </div>
        )}
      </div>
      
      {isCustomRange && (
        <div className="mt-3 text-xs text-gray-500">
          Select custom start and end dates to filter analytics data
        </div>
      )}
    </div>
  );
}
