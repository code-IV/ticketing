"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
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
import { dashboardService } from "@/services/dashboardService";

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

type RegistrationData = {
  date: string;
  new_users: number;
};

type RoleData = {
  role: string;
  count: number;
  percentage: number;
};

type StatusData = {
  status: string;
  count: number;
};

type BookingParticipation = {
  users_with_bookings: number;
  total_users: number;
  percentage: number;
};

type UserAnalyticsData = {
  registrationData: RegistrationData[];
  roleBreakdown: RoleData[];
  activeStatus: StatusData[];
  bookingParticipation: BookingParticipation;
};

type UserMetricsData = {
  bookingEngagement: {
    usersWithBookings: number;
    totalActiveUsers: number;
    percentage: string;
  };
  roleDistribution: RoleData[];
  statusDistribution: StatusData[];
  periodStats: {
    newUsers: number;
    totalUsers: number;
    period: string;
  };
};

const COLORS = ["#3b82f6", "#f97316", "#10b981", "#ef4444", "#8b5cf6"];

// ==================== Components ====================
const KpiCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType, 
  isDarkTheme 
}: {
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

  useEffect(() => {
    if (isCustomMode) {
      setCustomStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
      setCustomEndDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [isCustomMode]);

  const ranges = [
    {
      label: "Last 7 days",
      start: subDays(new Date(), 7),
      end: new Date(),
    },
    {
      label: "Last 30 days",
      start: subDays(new Date(), 30),
      end: new Date(),
    },
    {
      label: "Last 90 days",
      start: subDays(new Date(), 90),
      end: new Date(),
    },
    {
      label: "Custom",
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
            } else {
              setIsCustomMode(false);
              onChange({ ...selected, label: selected.label });
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
export default function UserAnalyticsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    label: "Last 30 days",
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  
  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData | null>(null);
  const [metricsData, setMetricsData] = useState<UserMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadAnalyticsData(
        dateRange.start.toISOString(),
        dateRange.end.toISOString(),
      );
      loadMetricsData('this_month');
    }
  }, [dateRange]);

  const loadAnalyticsData = async (start: string, end: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getUserAnalytics(start, end);
      
      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        setError('Failed to load user analytics data');
      }
    } catch (err) {
      setError('Error loading user analytics data');
      console.error('User analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMetricsData = async (period: string) => {
    try {
      const response = await dashboardService.getUserMetrics(period);
      
      if (response.success && response.data) {
        setMetricsData(response.data);
      }
    } catch (err) {
      console.error('User metrics error:', err);
    }
  };

  // Filter data based on date range
  const filterDataByDateRange = (
    data: RegistrationData[],
    range: DateRange,
  ) => {
    if (!range.start || !range.end || !data) return data;
    return data.filter((d) => {
      const date = new Date(d.date);
      return range.start && range.end && isWithinInterval(date, { start: range.start as Date, end: range.end as Date });
    });
  };

  const filteredRegistrationData = analyticsData ? filterDataByDateRange(analyticsData.registrationData, dateRange) : [];

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with title and date picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>User Analytics</h1>
          <DateRangePicker value={dateRange} onChange={(range) => setDateRange(range as any)} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard 
            title="Total Users" 
            value={metricsData?.periodStats.totalUsers.toLocaleString() || '0'} 
            icon={Users} 
            isDarkTheme={isDarkTheme} 
          />
          <KpiCard 
            title={`New Users (${dateRange.label})`} 
            value={analyticsData ? filteredRegistrationData.reduce((sum, day) => sum + day.new_users, 0).toLocaleString() : '0'} 
            icon={UserPlus} 
            isDarkTheme={isDarkTheme} 
          />
          <KpiCard 
            title="Active Users" 
            value={metricsData?.bookingEngagement.totalActiveUsers.toLocaleString() || '0'} 
            icon={UserCheck} 
            isDarkTheme={isDarkTheme} 
          />
          <KpiCard 
            title="Users with Bookings" 
            value={analyticsData?.bookingParticipation.users_with_bookings.toLocaleString() || '0'} 
            icon={Activity} 
            change={`${analyticsData?.bookingParticipation.percentage || 0}%`}
            changeType="positive"
            isDarkTheme={isDarkTheme} 
          />
        </div>

        {/* Analytics Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className={`rounded-xl p-6 ${isDarkTheme ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-center ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
          ) : analyticsData ? (
            <>
              {/* User Registration Trends */}
              <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                  <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>User Registration Trends</h2>
                  <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>New user registrations over time</p>
                </div>
                <div className="p-6">
                  <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={filteredRegistrationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="new_users"
                          stroke="#3b82f6"
                          fill="#93c5fd"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                    <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Role Distribution</h2>
                    <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Users by role type</p>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={analyticsData.roleBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.role}: ${entry.percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analyticsData.roleBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Active Status Distribution */}
                <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                    <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>User Status</h2>
                    <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Active vs inactive users</p>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={analyticsData.activeStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.status}: ${entry.count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analyticsData.activeStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Booking Participation */}
              <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
                  <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Booking Participation</h2>
                  <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Users who have made bookings</p>
                </div>
                <div className="p-6">
                  <div className={`rounded-xl p-6 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Users with Bookings</p>
                        <p className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          {analyticsData.bookingParticipation.users_with_bookings.toLocaleString()}
                        </p>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          of {analyticsData.bookingParticipation.total_users.toLocaleString()} total users
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                          {analyticsData.bookingParticipation.percentage}%
                        </div>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Participation Rate</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className={`w-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-4`}>
                        <div 
                          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${analyticsData.bookingParticipation.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}