"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
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
} from "recharts";
import { format, subDays, isWithinInterval } from "date-fns";
import { gameService } from "@/services/gameService";

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

type Game = {
  id: string;
  name: string;
  status: string;
  totalRevenue: number;
  totalBookings: number; // same as ticketsSold for now
  avgOccupancy: number;   // not provided by API, default 0
  eventsCount: number;    // not provided, default 0
  ticketsSold: number;
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

// API response types
type DashboardSummary = {
  totalRevenue: number;
  totalTickets: number;
  topPerformingGame: string;
};

type RevenueByGameItem = {
  game: string;
  revenue: number;
};

type TicketsByGameItem = {
  game: string;
  tickets: number;
};

type TableGameItem = {
  id: string;
  name: string;
  status: string;
  totalRevenue: number;
  ticketsSold: number;
  topTicketType: string;
  topTicketPrice: number;
  topTicketSold: number;
};

type DashboardData = {
  summary: DashboardSummary;
  revenueByGame: RevenueByGameItem[];
  ticketsByGame: TicketsByGameItem[];
  tableData: TableGameItem[];
};

// ==================== Helper to map API status to display status ====================
const mapStatus = (apiStatus: string): string => {
  switch (apiStatus) {
    case "OPEN":
      return "active";
    case "ON_MAINTENANCE":
      return "maintenance";
    case "CLOSED":
      return "closed";
    default:
      return apiStatus.toLowerCase();
  }
};

// ==================== KPI Card Component ====================
const KpiCard = ({
  title,
  value,
  icon: Icon,
  isDarkTheme,
}: {
  title: string;
  value: string | number;
  icon: any;
  isDarkTheme: boolean;
}) => (
  <div
    className={`rounded-xl p-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"} border`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-sm font-medium ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
        >
          {title}
        </p>
        <p
          className={`text-2xl font-bold mt-1 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
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
export default function GamesAnalyticsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
    const [dateRange, setDateRange] = useState<DateRange>({
    label: "Last 7 days",
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    if (!dateRange.start || !dateRange.end) return;
    setLoading(true);
    try {
      const response = await gameService.getDashboard(
        dateRange.start.toISOString(),
        dateRange.end.toISOString(),
        dateRange.label
      );
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  // Transform API games to our Game type
  const games: Game[] = dashboardData?.tableData.map(item => ({
    id: item.id,
    name: item.name,
    status: mapStatus(item.status),
    totalRevenue: item.totalRevenue,
    totalBookings: item.ticketsSold,
    avgOccupancy: 0, // not provided
    eventsCount: 0,  // not provided
    ticketsSold: item.ticketsSold,
  })) || [];

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}>
        <p className={isDarkTheme ? "text-white" : "text-gray-900"}>Loading analytics...</p>
      </div>
    );
  }

  // Main games list with charts
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
              Games Analytics
            </h1>
            <div className="flex items-center gap-2">
              <select
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  isDarkTheme
                    ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                }`}
                style={{ color: isDarkTheme ? "white" : "#111827" }}
                value={dateRange.label}
                onChange={(e) => {
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
                  const selected = ranges.find(
                    (r) => r.label === e.target.value,
                  );
                  if (selected) {
                    if (selected.label === "Custom") {
                      setIsCustomMode(true);
                      setDateRange({ label: "Custom", start: null, end: null });
                    } else {
                      setIsCustomMode(false);
                      setDateRange(selected as DateRange);
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
                      setDateRange({
                        label: "Custom",
                        start: startDate,
                        end: endDate,
                      });
                    }}
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                      isDarkTheme
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                    }`}
                    placeholder="Start date"
                  />
                  <span className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      const startDate = new Date(customStartDate);
                      const endDate = new Date(e.target.value);
                      setDateRange({
                        label: "Custom",
                        start: startDate,
                        end: endDate,
                      });
                    }}
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                      isDarkTheme
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                    }`}
                    placeholder="End date"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Back Navigation */}
          <button
            onClick={() => router.push("/analitics")}
            className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            ← Back to Analytics Dashboard
          </button>

          {/* Summary KPIs */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KpiCard
                title="Total Revenue"
                value={`$${dashboardData.summary.totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                isDarkTheme={isDarkTheme}
              />
              <KpiCard
                title="Total Tickets Sold"
                value={dashboardData.summary.totalTickets.toLocaleString()}
                icon={Ticket}
                isDarkTheme={isDarkTheme}
              />
              <KpiCard
                title="Top Performing Game"
                value={dashboardData.summary.topPerformingGame}
                icon={TrendingUp}
                isDarkTheme={isDarkTheme}
              />
            </div>
          )}

          <div className="space-y-6">
            {/* Revenue by Game Chart */}
            <div
              className={`rounded-xl p-4 mb-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
            >
              <h3
                className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
              >
                Revenue by Game
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData?.revenueByGame || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="game" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tickets Sold by Game Chart */}
            <div
              className={`rounded-xl p-4 mb-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
            >
              <h3
                className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
              >
                Tickets Sold by Game
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData?.ticketsByGame || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="game" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Games Table */}
            <div
              className={`rounded-xl overflow-hidden ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
            >
              <table className="w-full text-sm">
                <thead
                  className={`${isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}`}
                >
                  <tr>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Game
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Total Revenue
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Total Bookings
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Avg Occupancy
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Events
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr
                      key={game.id}
                      className={`border-t cursor-pointer ${isDarkTheme ? "border-gray-700 hover:bg-[#1a1a1a]" : "border-gray-100 hover:bg-gray-50"}`}
                      onClick={() => router.push(`/analitics/games/${game.id}`)}
                    >
                      <td
                        className={`px-4 py-3 font-medium ${isDarkTheme ? "text-white" : ""}`}
                      >
                        {game.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            game.status === "active"
                              ? isDarkTheme
                                ? "bg-green-900/20 text-green-400"
                                : "bg-green-100 text-green-700"
                              : game.status === "maintenance"
                              ? isDarkTheme
                                ? "bg-yellow-900/20 text-yellow-400"
                                : "bg-yellow-100 text-yellow-700"
                              : isDarkTheme
                                ? "bg-red-900/20 text-red-400"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {game.status}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        ${game.totalRevenue.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        {game.totalBookings.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        {game.avgOccupancy}%
                      </td>
                      <td
                        className={`px-4 py-3 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        {game.eventsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
}