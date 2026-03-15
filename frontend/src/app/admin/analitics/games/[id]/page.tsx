"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Ticket,
  DollarSign,
  Activity,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { gameService } from "@/services/gameService";

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

type GameAnalytics = {
  totalRevenue: number;
  totalBookings: number;
  revenueTrend: Array<{ date: string; revenue: number }>;
  bookingsTrend: Array<{ date: string; bookings: number }>;
  topPerformingTickets: Array<{
    category: string;
    price: number;
    ticketSold: number;
    revenue: number;
  }>;
};

// KPI Card Component
const KpiCard = ({ title, value, icon: Icon, isDarkTheme }: any) => (
  <div
    className={`rounded-xl p-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-sm font-medium ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
        >
          {title}
        </p>
        <p
          className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
        >
          {value}
        </p>
      </div>
      <div
        className={`p-3 rounded-lg ${isDarkTheme ? "bg-blue-900/20" : "bg-blue-50"}`}
      >
        <Icon
          className={`w-6 h-6 ${isDarkTheme ? "text-blue-400" : "text-blue-600"}`}
        />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function GameDetailPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const gameId = id;

  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    label: "d",
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [customEndDate, setCustomEndDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [customPeriod, setCustomPeriod] = useState("custom");

  useEffect(() => {
    if (gameId && dateRange.start && dateRange.end) {
      const fetchAnalytics = async () => {
        try {
          setLoading(true);
          setError(null);
          const period =
            dateRange.label === "Custom" ? customPeriod : dateRange.label;
          const response = await gameService.getAnalytics(
            gameId,
            dateRange.start.toISOString(),
            dateRange.end.toISOString(),
            period,
          );
          setAnalytics(response.data);
        } catch (err) {
          console.error("Error fetching game analytics:", err);
          setError("Failed to load game data");
        } finally {
          setLoading(false);
        }
      };

      fetchAnalytics();
    }
  }, [gameId, dateRange, customPeriod]);

  // Helper to format date for display
  const formatChartDate = (isoString: string) => {
    try {
      return format(parseISO(isoString), "MMM dd");
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
      >
        <div className="flex items-center gap-3">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "var(--accent)" }}
          />
          <p className={isDarkTheme ? "text-white" : "text-gray-900"}>
            Loading game analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/admin/analitics/games")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div
        className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1
            className={`text-2xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Game Not Found
          </h1>
          <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
            No analytics data available for this game.
          </p>
          <button
            onClick={() => router.push("/admin/analitics/games")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts (sort by date)
  const revenueData = [...analytics.revenueTrend]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item) => ({
      ...item,
      displayDate: formatChartDate(item.date),
    }));

  const bookingsData = [...analytics.bookingsTrend]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item) => ({
      ...item,
      displayDate: formatChartDate(item.date),
    }));

  const ticketData = analytics.topPerformingTickets || [];

  return (
    <div
      className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with title and date picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1
            className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Game Analytics
          </h1>
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
                  {
                    label: "7d",
                    start: subDays(new Date(), 7),
                    end: new Date(),
                  },
                  {
                    label: "30d",
                    start: subDays(new Date(), 30),
                    end: new Date(),
                  },
                  {
                    label: "90d",
                    start: subDays(new Date(), 90),
                    end: new Date(),
                  },
                  { label: "Custom", start: null, end: null },
                ];
                const selected = ranges.find((r) => r.label === e.target.value);
                if (selected) {
                  if (selected.label === "Custom") {
                    setIsCustomMode(true);
                    if (dateRange.start && dateRange.end) {
                      setCustomStartDate(format(dateRange.start, "yyyy-MM-dd"));
                      setCustomEndDate(format(dateRange.end, "yyyy-MM-dd"));
                    }
                    setCustomPeriod("custom");
                    setDateRange({
                      label: "Custom",
                      start: dateRange.start,
                      end: dateRange.end,
                    });
                  } else {
                    setIsCustomMode(false);
                    setDateRange(selected as DateRange);
                  }
                }
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="Custom">Custom</option>
            </select>
            {isCustomMode && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    if (customEndDate) {
                      const startDate = new Date(
                        e.target.value + "T00:00:00.000Z",
                      );
                      const endDate = new Date(
                        customEndDate + "T00:00:00.000Z",
                      );
                      setDateRange({
                        label: "Custom",
                        start: startDate,
                        end: endDate,
                      });
                    }
                  }}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                    isDarkTheme
                      ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                  }`}
                  placeholder="Start"
                />
                <span
                  className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}
                >
                  to
                </span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    if (customStartDate) {
                      const startDate = new Date(
                        customStartDate + "T00:00:00.000Z",
                      );
                      const endDate = new Date(
                        e.target.value + "T00:00:00.000Z",
                      );
                      setDateRange({
                        label: "Custom",
                        start: startDate,
                        end: endDate,
                      });
                    }
                  }}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                    isDarkTheme
                      ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                  }`}
                  placeholder="End"
                />
                <input
                  type="text"
                  value={customPeriod}
                  onChange={(e) => setCustomPeriod(e.target.value)}
                  placeholder="Period"
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm w-24 ${
                    isDarkTheme
                      ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push("/admin/analitics/games")}
          className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
        >
          <ChevronLeft size={16} /> Back to Games
        </button>

        {/* Game KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <KpiCard
            title="Total Revenue"
            value={`$${analytics.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Total Bookings"
            value={analytics.totalBookings.toLocaleString()}
            icon={Ticket}
            isDarkTheme={isDarkTheme}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
          >
            <h3
              className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
            >
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: any) => [`$${value}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
          >
            <h3
              className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
            >
              Bookings Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: any) => [`${value} bookings`, "Bookings"]}
                />
                <Line type="monotone" dataKey="bookings" stroke="#f97316" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Types Table */}
        <div
          className={`rounded-xl overflow-hidden ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div
            className={`px-6 py-4 border-b ${isDarkTheme ? "border-gray-700 bg-[#1a1a1a]" : "border-gray-200 bg-gray-50"}`}
          >
            <h3
              className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
            >
              Ticket Types Performance
            </h3>
          </div>
          <div className="p-6">
            {ticketData.length === 0 ? (
              <p
                className={`text-center ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
              >
                No ticket data available for this period.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className={isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Ticket Type
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Avg Price
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Tickets Sold
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticketData.map((ticket, index) => (
                    <tr
                      key={index}
                      className={`border-t ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}
                    >
                      <td
                        className={`px-4 py-2 font-medium ${isDarkTheme ? "text-white" : ""}`}
                      >
                        {ticket.category}
                      </td>
                      <td
                        className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        ${ticket.price}
                      </td>
                      <td
                        className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        {ticket.ticketSold}
                      </td>
                      <td
                        className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        ${ticket.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
