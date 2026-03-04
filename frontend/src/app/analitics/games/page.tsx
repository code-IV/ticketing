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
  id: number;
  name: string;
  status: string;
  totalRevenue: number;
  totalBookings: number;
  avgOccupancy: number;
  eventsCount: number;
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

type RevenueData = {
  date: string;
  revenue: number;
};

type BookingData = {
  date: string;
  bookings: number;
};

type TicketTypeData = {
  type: string;
  avgPrice: number;
  sold: number;
  revenue: number;
};

// ==================== Mock Data ====================
const mockGames: Game[] = [
  {
    id: 1,
    name: "Cyber Realm",
    status: "active",
    totalRevenue: 85000,
    totalBookings: 2100,
    avgOccupancy: 82,
    eventsCount: 5,
    ticketsSold: 2100,
  },
  {
    id: 2,
    name: "Speed Racer",
    status: "maintenance",
    totalRevenue: 42000,
    totalBookings: 1100,
    avgOccupancy: 68,
    eventsCount: 3,
    ticketsSold: 1100,
  },
  {
    id: 3,
    name: "Fantasy Quest",
    status: "active",
    totalRevenue: 120000,
    totalBookings: 3200,
    avgOccupancy: 91,
    eventsCount: 8,
    ticketsSold: 3200,
  },
  {
    id: 4,
    name: "Space Odyssey",
    status: "active",
    totalRevenue: 65000,
    totalBookings: 1800,
    avgOccupancy: 75,
    eventsCount: 4,
    ticketsSold: 1800,
  },
  {
    id: 5,
    name: "Dragon Warriors",
    status: "active",
    totalRevenue: 95000,
    totalBookings: 2700,
    avgOccupancy: 88,
    eventsCount: 6,
    ticketsSold: 2700,
  },
];

const mockEvents: Event[] = [
  {
    id: 101,
    name: "Summer Pro League",
    game: "Cyber Realm",
    date: "2026-08-15",
    status: "Active",
    revenue: 12000,
    ticketsSold: 85,
    capacity: 100,
    occupancy: 85,
  },
  {
    id: 102,
    name: "Midnight Scrims",
    game: "Cyber Realm",
    date: "2026-08-20",
    status: "Sold Out",
    revenue: 18000,
    ticketsSold: 120,
    capacity: 120,
    occupancy: 100,
  },
  {
    id: 103,
    name: "Newbie Bootcamp",
    game: "Fantasy Quest",
    date: "2026-09-01",
    status: "Draft",
    revenue: 0,
    ticketsSold: 12,
    capacity: 50,
    occupancy: 24,
  },
  {
    id: 104,
    name: "Pro Tournament",
    game: "Speed Racer",
    date: "2026-08-10",
    status: "Active",
    revenue: 8500,
    ticketsSold: 42,
    capacity: 60,
    occupancy: 70,
  },
];

const getGameRevenueSeries = (
  gameId: number,
  dateRange: DateRange,
): RevenueData[] => {
  if (!dateRange.start || !dateRange.end) return [];
  const days = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const base = gameId * 1000;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start!.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: format(date, "yyyy-MM-dd"),
      revenue: base + Math.floor(Math.random() * 3000) + 1000,
    };
  });
};

const getGameBookingsSeries = (
  gameId: number,
  dateRange: DateRange,
): BookingData[] => {
  if (!dateRange.start || !dateRange.end) return [];
  const days = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const base = gameId * 50;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start!.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: format(date, "yyyy-MM-dd"),
      bookings: base + Math.floor(Math.random() * 20) + 10,
    };
  });
};

const revenueByGame = mockGames.map((g) => ({
  game: g.name,
  revenue: g.totalRevenue,
}));
const ticketsSoldByGame = mockGames.map((g) => ({
  game: g.name,
  tickets: g.ticketsSold,
}));

const getTicketTypeData = (gameId: number): TicketTypeData[] => {
  // Base ticket types for all games
  const baseTicketTypes = [
    { type: "Standard", avgPrice: 25, sold: 150, revenue: 3750 },
    { type: "Premium", avgPrice: 45, sold: 80, revenue: 3600 },
    { type: "VIP", avgPrice: 85, sold: 20, revenue: 1700 },
  ];

  // Add game-specific variations
  if (gameId === 1) {
    // Cyber Realm
    return [
      ...baseTicketTypes,
      { type: "Pro Pass", avgPrice: 120, sold: 15, revenue: 1800 },
    ];
  } else if (gameId === 3) {
    // Fantasy Quest
    return [
      ...baseTicketTypes,
      { type: "Family Pack", avgPrice: 95, sold: 25, revenue: 2375 },
    ];
  }

  return baseTicketTypes;
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
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    label: "3d",
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  useEffect(() => {
    loadEvent(
      dateRange.start.toISOString(),
      dateRange.end.toISOString(),
      dateRange.label,
    );
  }, []);

  const loadEvent = async (
    startDate: string,
    endDate: string,
    period: string,
  ) => {
    const response = await gameService.getDashboard(startDate, endDate, period);
    console.log(response.data);
  };

  if (selectedGame) {
    // Show detailed view for selected game
    const gameRevenueSeries = getGameRevenueSeries(selectedGame.id, dateRange);
    const gameBookingsSeries = getGameBookingsSeries(
      selectedGame.id,
      dateRange,
    );
    const ticketTypeData = getTicketTypeData(selectedGame.id);

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
              {selectedGame.name} Analytics
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
                      label: "Last 3 months",
                      start: subDays(new Date(), 90),
                      end: new Date(),
                    },
                  ];
                  const selected = ranges.find(
                    (r) => r.label === e.target.value,
                  );
                  if (selected) setDateRange(selected);
                }}
              >
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 3 months">Last 3 months</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => setSelectedGame(null)}
            className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            ← Back to Games
          </button>

          {/* Game KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <KpiCard
              title="Total Revenue"
              value={`$${selectedGame.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              isDarkTheme={isDarkTheme}
            />
            <KpiCard
              title="Total Bookings"
              value={selectedGame.totalBookings.toLocaleString()}
              icon={Ticket}
              isDarkTheme={isDarkTheme}
            />
            <KpiCard
              title="Avg Occupancy"
              value={`${selectedGame.avgOccupancy}%`}
              icon={Activity}
              isDarkTheme={isDarkTheme}
            />
            <KpiCard
              title="Events"
              value={selectedGame.eventsCount}
              icon={Calendar}
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
                <LineChart data={gameRevenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
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
                <LineChart data={gameBookingsSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
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
              <table className="w-full text-sm">
                <thead
                  className={`${isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}`}
                >
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
                      Sold
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ticketTypeData.map((ticket, index) => (
                    <tr
                      key={index}
                      className={`border-t ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}
                    >
                      <td
                        className={`px-4 py-2 font-medium ${isDarkTheme ? "text-white" : ""}`}
                      >
                        {ticket.type}
                      </td>
                      <td
                        className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        ${ticket.avgPrice}
                      </td>
                      <td
                        className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        {ticket.sold}
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
            </div>
          </div>
        </div>
      </div>
    );
  } else {
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
                      label: "Last 3 months",
                      start: subDays(new Date(), 90),
                      end: new Date(),
                    },
                  ];
                  const selected = ranges.find(
                    (r) => r.label === e.target.value,
                  );
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
            onClick={() => router.push("/analitics")}
            className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            ← Back to Analytics Dashboard
          </button>

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
                <BarChart data={revenueByGame}>
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
                <BarChart data={ticketsSoldByGame}>
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
                  {mockGames.map((game) => (
                    <tr
                      key={game.id}
                      className={`border-t cursor-pointer ${isDarkTheme ? "border-gray-700 hover:bg-[#1a1a1a]" : "border-gray-100 hover:bg-gray-50"}`}
                      onClick={() => setSelectedGame(game)}
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
                              : isDarkTheme
                                ? "bg-yellow-900/20 text-yellow-400"
                                : "bg-yellow-100 text-yellow-700"
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
}
