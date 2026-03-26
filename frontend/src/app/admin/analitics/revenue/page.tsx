"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
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
} from "recharts";
import { format, subDays, isWithinInterval } from "date-fns";
import { dashboardService } from "@/services/dashboardService";

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

type RevenueByTicketType = {
  type: string;
  revenue: number;
};

type RevenueByGame = {
  game: string;
  revenue: number;
};

const COLORS = ["#3b82f6", "#f97316", "#10b981", "#ef4444", "#8b5cf6"];

// ==================== KPI Card Component ====================
const KpiCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  isDarkTheme,
}: {
  title: string;
  value: string;
  icon: any;
  change?: string;
  changeType?: "positive" | "negative";
  isDarkTheme: boolean;
}) => (
  <div
    className={`rounded-xl p-6 ${
      isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-sm font-medium ${
            isDarkTheme ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {title}
        </p>
        <p
          className={`text-2xl font-bold ${
            isDarkTheme ? "text-white" : "text-gray-900"
          }`}
        >
          {value}
        </p>
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
      <div
        className={`p-3 rounded-lg ${
          isDarkTheme ? "bg-indigo-900/20" : "bg-blue-50"
        }`}
      >
        <Icon className={`w-6 h-6 ${isDarkTheme ? "text-accent" : "text-accent"}`} />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function RevenueAnalyticsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>({
    label: "Last 30 days",
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revenueTimeSeries, setRevenueTimeSeries] = useState<RevenueData[]>([]);
  const [revenueByTicketType, setRevenueByTicketType] = useState<RevenueByTicketType[]>([]);
  const [revenueByGame, setRevenueByGame] = useState<RevenueByGame[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    averageRevenue: 0,
    projectedChange: 0,
  });

  // ==================== API Fetch ====================
  const loadDashboard = async (start: string, end: string, label: string) => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboardRevenue(start, end, label);

      // ==================== Map API ====================
      const mapTimeSeries = (timeSeries: any): RevenueData[] =>
        timeSeries.map((item: any) => ({
          date: format(new Date(item.date), "yyyy-MM-dd"),
          revenue: Number(item.revenue),
        }));

      const mapRevenueByTicketType = (data: any) =>
        data.map((item: any) => ({
          type: item.category,
          revenue: Number(item.revenue),
        }));

      const mapRevenueByGame = (data: any) =>
        data.map((item: any) => ({
          game: item.name,
          revenue: Number(item.revenue),
        }));

      // ==================== Set State ====================
      setRevenueTimeSeries(mapTimeSeries(response.timeSeries || []));
      setRevenueByTicketType(mapRevenueByTicketType(response.revenueByTicketType || []));
      setRevenueByGame(mapRevenueByGame(response.topPerformers?.games || []));
      setSummary({
        totalRevenue: response.summary?.totalRevenue || 0,
        averageRevenue: response.summary?.averageRevenue || 0,
        projectedChange: response.summary?.projectedChange || 0,
      });
    } catch (err) {
      console.error("Error fetching revenue analytics:", err);
      setError("Failed to load revenue analytics data");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Filter Data By Date ====================
  const filterDataByDateRange = (data: RevenueData[], range: DateRange) => {
    if (!range.start || !range.end) return data;
    return data.filter((d) => {
      const date = new Date(d.date);
      return isWithinInterval(date, { start: range.start!, end: range.end! });
    });
  };

  const filteredRevenueSeries = filterDataByDateRange(revenueTimeSeries, dateRange);

  // ==================== Load on Mount ====================
  useEffect(() => {
    loadDashboard(
      dateRange.start!.toISOString(),
      dateRange.end!.toISOString(),
      dateRange.label
    );
  }, []);

  if (loading) return <p className={`text-center mt-10 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Loading...</p>;
  if (error) return <p className={`text-center mt-10 text-red-600`}>{error}</p>;

  // ==================== JSX ====================
  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Revenue Analytics
          </h1>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkTheme
                  ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
              }`}
              value={dateRange.label}
              onChange={(e) => {
                const ranges = [
                  { label: "Last 7 days", start: subDays(new Date(), 7), end: new Date() },
                  { label: "Last 30 days", start: subDays(new Date(), 30), end: new Date() },
                  { label: "Last 90 days", start: subDays(new Date(), 90), end: new Date() },
                  { label: "Custom", start: null, end: null },
                ];
                const selected = ranges.find((r) => r.label === e.target.value);
                if (selected) {
                  if (selected.label === "Custom") {
                    setIsCustomMode(true);
                    setDateRange({ label: "Custom", start: null, end: null });
                  } else {
                    setIsCustomMode(false);
                    setDateRange(selected as DateRange);
                    loadDashboard(
                      (selected as DateRange).start!.toISOString(),
                      (selected as DateRange).end!.toISOString(),
                      (selected as DateRange).label
                    );
                  }
                }
              }}
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 90 days">Last 90 days</option>
              <option value="Custom">Custom</option>
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
                    setDateRange({ label: "Custom", start: startDate, end: endDate });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm bg-white text-gray-900"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    const startDate = new Date(customStartDate);
                    const endDate = new Date(e.target.value);
                    setDateRange({ label: "Custom", start: startDate, end: endDate });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm bg-white text-gray-900"
                />
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/analitics")}
          className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
        >
          ← Back to Analytics Dashboard
        </button>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KpiCard
            title="Total Revenue"
            value={`$${summary.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Avg Revenue/Booking"
            value={`$${summary.averageRevenue.toFixed(2)}`}
            icon={TrendingUp}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Projected Change"
            value={`$${(summary.totalRevenue + (summary.totalRevenue * summary.projectedChange) / 100).toLocaleString()}`}
            icon={BarChart3}
            change={`${summary.projectedChange}%`}
            changeType={summary.projectedChange >= 0 ? "positive" : "negative"}
            isDarkTheme={isDarkTheme}
          />
        </div>

        {/* Revenue Over Time */}
        <div className={`rounded-xl p-4 mb-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Revenue Over Time</h3>
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

        {/* Revenue by Ticket Type */}
        <div className={`rounded-xl p-4 mb-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Revenue by Ticket Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={revenueByTicketType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.type}: $${entry.revenue}`}
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

        {/* Revenue by Game */}
        <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Revenue by Game</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByGame}>
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
  );
}