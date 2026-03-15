"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Ticket,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";
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
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, isWithinInterval } from "date-fns";
import Link from "next/link";
import { dashboardService } from "@/services/dashboardService";
import { DashboardResponse, RevenueTrend, TicketsTrend, TopGame } from "@/types";

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
  period: string;
};

type Game = {
  id: number;
  name: string;
  status: string;
  totalRevenue: number;
  totalBookings: number;
  avgOccupancy: number;
  eventsCount: number;
};

type Event = {
  id: number;
  name: string;
  game: string;
  date: string;
  status: string;
  revenue: number;
  ticketsSold: number;
  capacity: number;
  occupancy: number;
};

type RevenueData = {
  date: string;
  revenue: number;
};

type TicketsData = {
  date: string;
  ticketsSold: number;
};

// ==================== State Management ====================
const COLORS = ["#3b82f6", "#f97316", "#10b981", "#ef4444", "#8b5cf6"];

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
          <p
            className={`text-sm font-medium ${
              changeType === "positive" ? "text-green-600" : "text-red-600"
            }`}
          >
            {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${isDarkTheme ? 'bg-indigo-900/20' : 'bg-blue-50'}`}>
        <Icon className={`w-6 h-6 ${isDarkTheme ? 'text-indigo-400' : ''}`} style={{ color: isDarkTheme ? 'var(--accent)' : 'var(--accent)' }} />
      </div>
    </div>
  </div>
);

const DateRangePicker = ({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Initialize custom dates when component mounts or when switching to custom mode
  useEffect(() => {
    if (isCustomMode) {
      setCustomStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
      setCustomEndDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [isCustomMode]);
  const ranges = [
    {
      label: "Last 7 days",
      period: "d",
      start: subDays(new Date(), 7),
      end: new Date(),
    },
    {
      label: "Last 30 days",
      period: "d",
      start: subDays(new Date(), 30),
      end: new Date(),
    },
    {
      label: "Last 90 days",
      period: "d",
      start: subDays(new Date(), 90),
      end: new Date(),
    },
    {
      label: "Custom",
      period: "d",
      start: null,
      end: null,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value.label}
        onChange={(e) => {
          const selected = ranges.find((r) => r.label === e.target.value);
          if (selected) {
            if (selected.label === "Custom") {
              setIsCustomMode(true);
              // Don't update the range yet, wait for custom dates
            } else {
              setIsCustomMode(false);
              onChange(selected);
            }
          }
        }}
      >
        {ranges.map((range) => (
          <option key={range.label} value={range.label}>
            {range.label}
          </option>
        ))}
      </select>

      {isCustomMode && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => {
              setCustomStartDate(e.target.value);
              const startDate = new Date(e.target.value);
              const endDate = new Date(customEndDate);
              onChange({
                label: "Custom",
                period: "d",
                start: startDate,
                end: endDate,
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900"
            placeholder="Start date"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => {
              setCustomEndDate(e.target.value);
              const startDate = new Date(customStartDate);
              const endDate = new Date(e.target.value);
              onChange({
                label: "Custom",
                period: "d",
                start: startDate,
                end: endDate,
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900"
            placeholder="End date"
          />
        </div>
      )}
    </div>
  );
};

// ==================== Main Component ====================
export default function AnalyticsDashboardPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    label: "Last 30 days",
    period: "d",
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard(
      dateRange.start.toISOString(),
      dateRange.end.toISOString(),
      dateRange.period,
    );
  }, [dateRange]);

  const loadDashboard = async (start: string, end: string, label: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDashboard(start, end, label);
      console.log(response.data);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Error loading dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on date range
  const filterDataByDateRange = (
    data: RevenueTrend[] | TicketsTrend[],
    range: DateRange,
  ) => {
    if (!range.start || !range.end || !data) return data;
    return data.filter((d) => {
      const date = new Date(d.date);
      return isWithinInterval(date, { start: range.start, end: range.end });
    });
  };

  const filteredRevenueSeries = filterDataByDateRange(
    dashboardData?.revenueTrend || [],
    dateRange,
  );
  const filteredTicketsSeries = filterDataByDateRange(
    dashboardData?.ticketsTrend || [],
    dateRange,
  );

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with title and date picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Analytics Dashboard</h1>
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
                  { label: 'Last 7 days', period: 'd', start: subDays(new Date(), 7), end: new Date() },
                  { label: 'Last 30 days', period: 'd', start: subDays(new Date(), 30), end: new Date() },
                  { label: 'Last 3 months', period: 'd', start: subDays(new Date(), 90), end: new Date() },
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

        {/* Navigation Links */}
        <div className={`rounded-xl p-4 mb-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/analitics/revenue"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Revenue Analytics
            </Link>
            <Link
              href="/admin/analitics/games"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Games Analytics
            </Link>
            <Link
              href="/admin/analitics/events"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Events Analytics
            </Link>
            <Link
              href="/admin/analitics/bookings"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Booking Analytics
            </Link>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className={`rounded-xl p-6 ${isDarkTheme ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-center ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard 
                  title="Total Revenue" 
                  value={`$${dashboardData?.stats.totalRevenue.toLocaleString() || '0'}`} 
                  icon={DollarSign} 
                  isDarkTheme={isDarkTheme} 
                />
                <KpiCard 
                  title="Total Tickets Sold" 
                  value={dashboardData?.stats.totalTicketsSold.toLocaleString() || '0'} 
                  icon={Ticket} 
                  isDarkTheme={isDarkTheme} 
                />
                <KpiCard 
                  title="Active Games" 
                  value={dashboardData?.stats.activeGames.toString() || '0'} 
                  icon={Activity} 
                  isDarkTheme={isDarkTheme} 
                />
              </div>

          {/* Financial Analytics Section */}
          <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Financial Analytics</h2>
              <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Revenue trends and performance by game</p>
            </div>
            <div className="p-6 space-y-6">
              <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredRevenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fill="#93c5fd"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Top Games by Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData?.topGames || []}>
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

          {/* Ticket Sales Analytics Section */}
          <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Ticket Sales Analytics</h2>
              <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total tickets sold over time</p>
            </div>
            <div className="p-6">
              <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Total Tickets Sold</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredTicketsSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="ticketsSold"
                      stroke="#10b981"
                      fill="#86efac"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Events Section - Removed until real data is available */}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
