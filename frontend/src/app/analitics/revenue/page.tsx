"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, isWithinInterval } from 'date-fns';

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

type RevenueData = {
  date: string;
  revenue: number;
};

// ==================== Mock Data ====================
const generateRevenueTimeSeries = (days = 30): RevenueData[] => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      revenue: Math.floor(Math.random() * 5000) + 2000,
    });
  }
  return data;
};

const mockRevenueTimeSeries = generateRevenueTimeSeries(30);

const revenueByTicketType = [
  { type: 'Adult', revenue: 45000 },
  { type: 'Child', revenue: 28000 },
  { type: 'Senior', revenue: 15000 },
  { type: 'Student', revenue: 22000 },
  { type: 'Group', revenue: 15000 },
];

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#ef4444', '#8b5cf6'];

// ==================== Components ====================
const KpiCard = ({ title, value, icon: Icon, change, changeType, isDarkTheme }: {
  title: string;
  value: string;
  icon: any;
  change?: string;
  changeType?: 'positive' | 'negative';
  isDarkTheme: boolean;
}) => (
  <div className={`rounded-xl p-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {change && (
          <p className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${isDarkTheme ? 'bg-indigo-900/20' : 'bg-blue-50'}`}>
        <Icon className={`w-6 h-6 ${isDarkTheme ? 'text-accent' : 'text-accent'}`} />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function RevenueAnalyticsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    label: 'Last 7 days',
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  // Filter data based on date range
  const filterDataByDateRange = (data: RevenueData[], range: DateRange) => {
    if (!range.start || !range.end) return data;
    return data.filter(d => {
      const date = new Date(d.date);
      return range.start && range.end && isWithinInterval(date, { start: range.start as Date, end: range.end as Date });
    });
  };

  const filteredRevenueSeries = filterDataByDateRange(mockRevenueTimeSeries, dateRange);

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with title and date picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Revenue Analytics</h1>
          <div className="flex items-center gap-2">
            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkTheme 
                  ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
              style={{ color: isDarkTheme ? 'white' : '#111827' }}
              value={dateRange.label}
              onChange={(e) => {
                const ranges = [
                  { label: 'Last 7 days', start: subDays(new Date(), 7), end: new Date() },
                  { label: 'Last 30 days', start: subDays(new Date(), 30), end: new Date() },
                  { label: 'Last 3 months', start: subDays(new Date(), 90), end: new Date() },
                ];
                const selected = ranges.find(r => r.label === e.target.value);
                if (selected) setDateRange(selected);
              }}
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 3 months">Last 3 months</option>
            </select>
          </div>
        </div>

        {/* Back Navigation */}
        <button
          onClick={() => router.push('/analitics')}
          className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          ← Back to Analytics Dashboard
        </button>

        {/* Revenue Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Revenue" value="$125,000" icon={DollarSign} isDarkTheme={isDarkTheme} />
            <KpiCard title="Avg Revenue/Booking" value="$39.06" icon={TrendingUp} isDarkTheme={isDarkTheme} />
            <KpiCard title="Projected (this month)" value="$132,000" icon={BarChart3} change="+5.6%" changeType="positive" isDarkTheme={isDarkTheme} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredRevenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Revenue by Ticket Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={revenueByTicketType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={entry => `${entry.type}: $${entry.revenue}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {revenueByTicketType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Revenue by Game</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { game: 'Cyber Realm', revenue: 85000 },
                { game: 'Speed Racer', revenue: 42000 },
                { game: 'Fantasy Quest', revenue: 120000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
