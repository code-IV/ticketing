"use client";
import { useState, useEffect, useMemo } from "react";
import { User } from "@/types";
import {
  Search,
  UserPlus,
  Mail,
  ShieldCheck,
  ShieldX,
  Shield,
  CircleUser,
  Trash2,
  Edit2,
  Filter,
  Zap,
  ChevronDown,
  X,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import UserTable from "./components/UserTable";
import UserAnalyticsTab from "./components/userAnalyticsTab";

/**
 * Individual data point for Distributions (Roles/Status)
 */
interface DistributionPoint {
  role?: string; // Present in roleDistribution
  is_active?: boolean; // Present in statusDistribution
  count: number;
}

/**
 * Booking Engagement Metrics
 */
interface BookingEngagement {
  usersWithBookings: number;
  totalActiveUsers: number;
  percentage: string | number;
}

/**
 * Time-based counts (Live/New)
 */
interface PeriodStats {
  newUsers: number;
  totalUsers: number;
  period: string;
}

/**
 * The Complete Analytics Object
 * Matches the structure returned by metrics.getUserAnalytics()
 */
export interface UserAnalyticsData {
  bookingEngagement: BookingEngagement;
  roleDistribution: DistributionPoint[];
  statusDistribution: DistributionPoint[];
  periodStats: PeriodStats;
}

/**
 * The Standard API Response Wrapper
 */
export interface UserAnalyticsResponse {
  success: boolean;
  message: string;
  data: UserAnalyticsData;
}

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<"list" | "analytics">("analytics");
  const [users, setUsers] = useState<User[]>([]);
  const [analyticsData, setUserCountMetrics] = useState<
    Partial<UserAnalyticsData>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fix 2: Wrap loadUsers in useEffect so it actually runs
  useEffect(() => {
    loadMetrics("today");
  }, []);

  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async (period: string) => {
    setUserCountMetrics((prev) => ({ ...prev, user_count: undefined, period }));
    try {
      const response = await adminService.getUserCount(period);
      setUserCountMetrics(response.data || {});
    } catch (error) {
      console.error("Failed to load users Count:", error);
      setError("Failed to load users Count. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      // Use fallback value to ensure it never breaks
      total: users?.length || 0,
      admins: users?.filter((u) => u.role === "admin").length || 0,
      activeToday: Math.floor((users?.length || 0) * 0.4),
    }),
    [users],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-300" />
            Command Center
          </h1>
          <p className="text-blue-100 mt-2 opacity-90">
            Manage park visitors, staff permissions, and account security.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          {/* Finding the 'admin' count specifically */}
                          {analyticsData.roleDistribution.find(
                            (r) => r.role === "admin",
                          )?.count || 0}{" "}
                          Admins
                        </span>
                        <span className="text-[10px] font-bold text-blue-600">
                          {/* Finding the 'admin' count specifically */}
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

          {/* 2. Booking Engagement Card (New!) */}
          <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Booking Engagement Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-gray-900 mt-1">
                    {analyticsData?.bookingEngagement?.percentage}%
                  </p>
                </div>
                {/* Progress bar for visual engagement */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-1000"
                    style={{
                      width: `${analyticsData?.bookingEngagement?.percentage}%`,
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
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-4 px-2 font-bold text-sm transition-all ${activeTab === "analytics" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}
            >
              User Analytics
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`pb-4 px-2 font-bold text-sm transition-all ${activeTab === "list" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}
            >
              User List
            </button>
          </div>

          {activeTab === "list" ? <UserTable /> : <UserAnalyticsTab />}
        </div>
      </main>
    </div>
  );
}
