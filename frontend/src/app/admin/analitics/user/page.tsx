"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { adminService } from "@/services/adminService";
import { ShieldCheck, CircleUser, Zap, Shield } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

// Analytics Types
interface DistributionPoint {
  role?: string;
  is_active?: boolean;
  count: number;
}

interface BookingEngagement {
  usersWithBookings: number;
  totalActiveUsers: number;
  percentage: string | number;
}

interface PeriodStats {
  newUsers: number;
  totalUsers: number;
  period: string;
}

interface UserAnalyticsData {
  bookingEngagement: BookingEngagement;
  roleDistribution: DistributionPoint[];
  statusDistribution: DistributionPoint[];
  periodStats: PeriodStats;
}

interface RegistrationTrend {
  date: string;
  new_users: number | string;
}

interface RoleBreakdown {
  role: string;
  count: number | string;
  percentage: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function UserAnalyticsPage() {
  const { isDarkTheme } = useTheme();
  const [analyticsData, setAnalyticsData] = useState<Partial<UserAnalyticsData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [registrationTrend, setRegistrationTrend] = useState<RegistrationTrend[]>([]);
  const [roleBreakdown, setRoleBreakdown] = useState<RoleBreakdown[]>([]);

  // Load analytics metrics on mount
  useEffect(() => {
    loadMetrics("today");
    loadRegistrationTrend();
    loadRoleBreakdown();
  }, []);

  const loadMetrics = async (period: string) => {
    setAnalyticsData((prev) => ({ ...prev, user_count: undefined, period }));
    try {
      const response = await adminService.getUserCount(period);
      setAnalyticsData(response.data || {});
    } catch (error) {
      console.error("Failed to load users Count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegistrationTrend = async () => {
    try {
      const response = await adminService.getRegistrationTrend();
      const formattedData = response.data?.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        new_users: item.new_users,
      })) || [];
      setRegistrationTrend(formattedData);
    } catch (error) {
      console.error("Failed to load registration trend:", error);
    }
  };

  const loadRoleBreakdown = async () => {
    try {
      const response = await adminService.getRoleBreakdown();
      setRoleBreakdown(response.data || []);
    } catch (error) {
      console.error("Failed to load role breakdown:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isDarkTheme ? "text-white" : "text-slate-900"}`}>User Analytics</h1>
          <p className={`font-medium ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}>User engagement, registration trends, and role distribution</p>
        </div>
      </div>

      {/* Analytics Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 1. Total & Online Users Card */}
        <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Personnel{" "}
                </p>
                <ShieldCheck className="h-3 w-3 text-indigo-600" />
              </div>
              <p className="text-3xl font-black text-gray-900 mt-1 tabular-nums">
                {analyticsData?.periodStats?.totalUsers || (
                  <span className="animate-pulse">—</span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2">
              <div>
                {/* Role Statistic Badge */}
                {analyticsData?.roleDistribution &&
                  analyticsData.roleDistribution.length > 0 && (
                    <div className="flex flex-col items-center gap-1 bg-indigo-50 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-indigo-600">
                        {analyticsData.roleDistribution.find(
                          (r) => r.role === "admin",
                        )?.count || 0}{" "}
                        Admins
                      </span>
                      <span className="text-[10px] font-bold text-blue-600">
                        {analyticsData.roleDistribution.find(
                          (r) => r.role === "visitor",
                        )?.count || 0}{" "}
                        Visitors
                      </span>
                    </div>
                  )}
              </div>
              <div className="flex items-center justify-center p-4 bg-indigo-50 rounded-2xl group-hover:bg-blue-600 transition-colors duration-300">
                <CircleUser className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Booking Engagement Card */}
        <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Booking Engagement Rate
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {analyticsData?.bookingEngagement?.percentage || (
                    <span className="animate-pulse">—</span>
                  )}
                  {analyticsData?.bookingEngagement?.percentage != null &&
                    "%"}
                </p>
              </div>
              {/* Progress bar for visual engagement */}
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-1000"
                  style={{
                    width: `${analyticsData?.bookingEngagement?.percentage ?? 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-purple-600 transition-colors duration-300 ml-4">
              <Zap className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* 3. Dynamic Acquisition Card */}
        <div className="group bg-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="relative inline-block w-full">
                <select
                  value={analyticsData?.periodStats?.period}
                  onChange={(e) => loadMetrics(e.target.value)}
                  className="appearance-none bg-transparent pr-8 text-xs font-bold text-blue-600 uppercase tracking-wider focus:outline-none cursor-pointer hover:text-blue-700"
                >
                  <option value="today">New Today</option>
                  <option value="this_week">New This Week</option>
                  <option value="this_month">New This Month</option>
                  <option value="this_year">New This Year</option>
                  <option value="all_time">Total Growth</option>
                </select>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-gray-900 mt-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {analyticsData?.periodStats?.newUsers || (
                    <span className="animate-pulse">—</span>
                  )}
                </p>
                <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                  + Acquisition
                </span>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-2xl group-hover:bg-yellow-500 transition-colors duration-300">
              <ShieldCheck className="h-6 w-6 text-yellow-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend Chart */}
        <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Registration Trend</h2>
            <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>New user registrations over time</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="new_users" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Distribution Chart */}
        <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Role Distribution</h2>
            <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Users by role category</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, percentage }) => `${role}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {roleBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
