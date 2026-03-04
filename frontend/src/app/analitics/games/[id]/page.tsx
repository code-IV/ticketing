"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Ticket,
  DollarSign,
  PieChart,
  ChevronLeft,
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
import { format, subDays } from "date-fns";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import { DateRange } from "@/components/analytics/DateRangePicker";
import { gameService } from "@/services/gameService";

// ==================== Types ====================
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

type BookingData = {
  date: string;
  bookings: number;
};

type TicketTypeData = {
  type: string;
  category: string;
  sold: number;
  revenue: number;
  avgPrice: number;
  performance: number;
};

type TicketPerformanceData = {
  type: string;
  category: string;
  ticketsSold: number;
  revenue: number;
  avgPrice: number;
  performanceScore: number;
  popularity: number;
};

type RevenueContributionData = {
  date: string;
  adultRevenue: number;
  childRevenue: number;
  seniorRevenue: number;
  studentRevenue: number;
  groupRevenue: number;
  promotionalRevenue: number;
};

type RevenuePerTicketData = {
  date: string;
  vipRevenue: number;
  premiumRevenue: number;
  standardRevenue: number;
  groupRevenue: number;
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
  },
  {
    id: 2,
    name: "Speed Racer",
    status: "maintenance",
    totalRevenue: 42000,
    totalBookings: 1100,
    avgOccupancy: 68,
    eventsCount: 3,
  },
  {
    id: 3,
    name: "Fantasy Quest",
    status: "active",
    totalRevenue: 120000,
    totalBookings: 3200,
    avgOccupancy: 91,
    eventsCount: 8,
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
  const days = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const base = gameId * 1000;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
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
  const days = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const base = gameId * 50;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: format(date, "yyyy-MM-dd"),
      bookings: base + Math.floor(Math.random() * 100) + 20,
    };
  });
};

const getTicketTypeData = (gameId: number): TicketTypeData[] => {
  if (gameId === 1) {
    return [
      {
        type: "Adult Premium",
        category: "Adult",
        sold: 600,
        revenue: 51000,
        avgPrice: 85,
        performance: 85,
      },
      {
        type: "Child Basic",
        category: "Child",
        sold: 450,
        revenue: 13500,
        avgPrice: 30,
        performance: 75,
      },
      {
        type: "Adult Standard",
        category: "Adult",
        sold: 350,
        revenue: 17500,
        avgPrice: 50,
        performance: 70,
      },
      {
        type: "Senior Discount",
        category: "Senior",
        sold: 120,
        revenue: 6000,
        avgPrice: 50,
        performance: 65,
      },
      {
        type: "Student Package",
        category: "Student",
        sold: 280,
        revenue: 14000,
        avgPrice: 50,
        performance: 60,
      },
      {
        type: "Group Package",
        category: "Group",
        sold: 300,
        revenue: 18000,
        avgPrice: 60,
        performance: 80,
      },
    ];
  } else if (gameId === 2) {
    return [
      {
        type: "Adult Racing",
        category: "Adult",
        sold: 320,
        revenue: 20800,
        avgPrice: 65,
        performance: 78,
      },
      {
        type: "Child Mini",
        category: "Child",
        sold: 280,
        revenue: 11200,
        avgPrice: 40,
        performance: 72,
      },
      {
        type: "Adult Standard",
        category: "Adult",
        sold: 200,
        revenue: 10000,
        avgPrice: 50,
        performance: 68,
      },
      {
        type: "Senior Special",
        category: "Senior",
        sold: 80,
        revenue: 4000,
        avgPrice: 50,
        performance: 62,
      },
      {
        type: "Student Basic",
        category: "Student",
        sold: 150,
        revenue: 6000,
        avgPrice: 40,
        performance: 58,
      },
      {
        type: "Family Bundle",
        category: "Group",
        sold: 70,
        revenue: 4200,
        avgPrice: 60,
        performance: 75,
      },
    ];
  } else if (gameId === 3) {
    return [
      {
        type: "Adult VIP",
        category: "Adult",
        sold: 800,
        revenue: 120000,
        avgPrice: 150,
        performance: 95,
      },
      {
        type: "Child Adventure",
        category: "Child",
        sold: 500,
        revenue: 25000,
        avgPrice: 50,
        performance: 85,
      },
      {
        type: "Adult Premium",
        category: "Adult",
        sold: 600,
        revenue: 48000,
        avgPrice: 80,
        performance: 88,
      },
      {
        type: "Senior Explorer",
        category: "Senior",
        sold: 200,
        revenue: 12000,
        avgPrice: 60,
        performance: 75,
      },
      {
        type: "Student Quest",
        category: "Student",
        sold: 300,
        revenue: 18000,
        avgPrice: 60,
        performance: 70,
      },
      {
        type: "Group Quest",
        category: "Group",
        sold: 400,
        revenue: 20000,
        avgPrice: 50,
        performance: 82,
      },
    ];
  }
  // Fallback data for unknown games
  return [
    {
      type: "Standard Ticket",
      category: "Adult",
      sold: 100,
      revenue: 5000,
      avgPrice: 50,
      performance: 50,
    },
    {
      type: "Child Ticket",
      category: "Child",
      sold: 50,
      revenue: 1500,
      avgPrice: 30,
      performance: 40,
    },
    {
      type: "Senior Ticket",
      category: "Senior",
      sold: 30,
      revenue: 900,
      avgPrice: 30,
      performance: 35,
    },
    {
      type: "Group Package",
      category: "Group",
      sold: 20,
      revenue: 1000,
      avgPrice: 50,
      performance: 45,
    },
  ];
};

const getTicketPerformanceData = (gameId: number): TicketPerformanceData[] => {
  const ticketData = getTicketTypeData(gameId);
  return ticketData.map((ticket) => ({
    type: ticket.type,
    category: ticket.category,
    ticketsSold: ticket.sold,
    revenue: ticket.revenue,
    avgPrice: ticket.avgPrice,
    performanceScore: Math.round(
      (ticket.revenue / ticket.sold) * (ticket.sold / 100),
    ),
    popularity: Math.round(
      (ticket.sold / ticketData.reduce((sum, t) => sum + t.sold, 0)) * 100,
    ),
  }));
};

const getRevenueContributionSeries = (
  gameId: number,
  days = 30,
): RevenueContributionData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);

    if (gameId === 1) {
      return {
        date: format(date, "yyyy-MM-dd"),
        adultRevenue: Math.floor(Math.random() * 2000) + 1500,
        childRevenue: Math.floor(Math.random() * 800) + 400,
        seniorRevenue: Math.floor(Math.random() * 600) + 200,
        studentRevenue: Math.floor(Math.random() * 700) + 300,
        groupRevenue: Math.floor(Math.random() * 900) + 400,
        promotionalRevenue: Math.floor(Math.random() * 500) + 100,
      };
    } else if (gameId === 2) {
      return {
        date: format(date, "yyyy-MM-dd"),
        adultRevenue: Math.floor(Math.random() * 1200) + 800,
        childRevenue: Math.floor(Math.random() * 600) + 300,
        seniorRevenue: Math.floor(Math.random() * 400) + 150,
        studentRevenue: Math.floor(Math.random() * 500) + 200,
        groupRevenue: Math.floor(Math.random() * 600) + 200,
        promotionalRevenue: Math.floor(Math.random() * 300) + 50,
      };
    } else if (gameId === 3) {
      return {
        date: format(date, "yyyy-MM-dd"),
        adultRevenue: Math.floor(Math.random() * 3000) + 2000,
        childRevenue: Math.floor(Math.random() * 1200) + 600,
        seniorRevenue: Math.floor(Math.random() * 800) + 400,
        studentRevenue: Math.floor(Math.random() * 1000) + 500,
        groupRevenue: Math.floor(Math.random() * 1200) + 500,
        promotionalRevenue: Math.floor(Math.random() * 800) + 200,
      };
    }
    return {
      date: format(date, "yyyy-MM-dd"),
      adultRevenue: 0,
      childRevenue: 0,
      seniorRevenue: 0,
      studentRevenue: 0,
      groupRevenue: 0,
      promotionalRevenue: 0,
    };
  });
};

const getRevenuePerTicketSeries = (
  gameId: number,
  days = 30,
): RevenuePerTicketData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);

    if (gameId === 1) {
      return {
        date: format(date, "yyyy-MM-dd"),
        vipRevenue: Math.floor(Math.random() * 2000) + 1000,
        premiumRevenue: Math.floor(Math.random() * 1500) + 800,
        standardRevenue: Math.floor(Math.random() * 1000) + 500,
        groupRevenue: Math.floor(Math.random() * 800) + 200,
      };
    } else if (gameId === 2) {
      return {
        date: format(date, "yyyy-MM-dd"),
        vipRevenue: Math.floor(Math.random() * 1000) + 500,
        premiumRevenue: Math.floor(Math.random() * 800) + 400,
        standardRevenue: Math.floor(Math.random() * 600) + 300,
        groupRevenue: Math.floor(Math.random() * 500) + 150,
      };
    } else if (gameId === 3) {
      return {
        date: format(date, "yyyy-MM-dd"),
        vipRevenue: Math.floor(Math.random() * 3000) + 2000,
        premiumRevenue: Math.floor(Math.random() * 2000) + 1000,
        standardRevenue: Math.floor(Math.random() * 1500) + 800,
        groupRevenue: Math.floor(Math.random() * 1000) + 500,
      };
    }
    return {
      date: format(date, "yyyy-MM-dd"),
      vipRevenue: 0,
      premiumRevenue: 0,
      standardRevenue: 0,
      groupRevenue: 0,
    };
  });
};

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
];

// ==================== Components ====================
const KpiCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: any;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 style={{ color: 'var(--accent)' }}" />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function GameDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const gameId = id;

  const [dateRange, setDateRange] = useState<DateRange>({
    label: "1d",
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  useEffect(() => {
    loadEvent(
      gameId,
      dateRange.start.toISOString(),
      dateRange.end.toISOString(),
      dateRange.label,
    );
  }, []);

  const loadEvent = async (
    id: string,
    startDate: string,
    endDate: string,
    period: string,
  ) => {
    const response = await gameService.getAnalytics(
      id,
      startDate,
      endDate,
      period,
    );
    console.log(response.data);
  };

  const selectedGame = mockGames.find((g) => g.id === gameId) || null;

  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Game Not Found
            </h1>
            <p className="text-gray-600">
              The game you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/analitics/games")}
              className="mt-4 px-4 py-2 style={{ backgroundColor: 'var(--accent)' }} text-white rounded-lg hover:bg-blue-700"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gameEvents = mockEvents.filter((e) => e.game === selectedGame.name);
  const gameRevenueSeries = getGameRevenueSeries(selectedGame.id, dateRange);
  const gameBookingsSeries = getGameBookingsSeries(selectedGame.id, dateRange);
  const ticketTypeData = getTicketTypeData(selectedGame.id);
  const ticketPerformanceData = getTicketPerformanceData(selectedGame.id);
  const revenueContributionSeries = getRevenueContributionSeries(
    selectedGame.id,
  );
  const revenuePerTicketSeries = getRevenuePerTicketSeries(selectedGame.id);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <AnalyticsHeader
            title={`${selectedGame.name} Analytics`}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <button
            onClick={() => router.push("/newanalitics/games")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={16} /> Back to Games
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedGame.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              title="Total Revenue"
              value={`$${selectedGame.totalRevenue}`}
              icon={DollarSign}
            />
            <KpiCard
              title="Total Bookings"
              value={selectedGame.totalBookings}
              icon={Ticket}
            />
            <KpiCard
              title="Avg Occupancy"
              value={`${selectedGame.avgOccupancy}%`}
              icon={PieChart}
            />
            <KpiCard
              title="Events"
              value={selectedGame.eventsCount}
              icon={Calendar}
            />
          </div>

          {/* Charts for this game */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Revenue Trend ({dateRange.label})
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

            {/* Bookings Trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Bookings Trend ({dateRange.label})
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

            {/* Top Performing Ticket Types (Bar) */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Top Performing Ticket Types
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === "sold"
                        ? `${value} tickets`
                        : name === "revenue"
                          ? `$${value}`
                          : name === "avgPrice"
                            ? `$${value}`
                            : value,
                      name === "sold"
                        ? "Tickets Sold"
                        : name === "revenue"
                          ? "Revenue"
                          : "Avg Price",
                    ]}
                  />
                  <Bar dataKey="sold" fill="#3b82f6" />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Per Ticket Type (Line) */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Revenue Per Ticket Type (Last 30 days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenuePerTicketSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="vipRevenue"
                    stroke="#8b5cf6"
                    name="VIP Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="premiumRevenue"
                    stroke="#f97316"
                    name="Premium Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="standardRevenue"
                    stroke="#10b981"
                    name="Standard Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="groupRevenue"
                    stroke="#f59e0b"
                    name="Group Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Ticket Type Distribution (Pie) - FIXED */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Ticket Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={ticketTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.type}: ${entry.sold} tickets`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sold"
                  >
                    {ticketTypeData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Best Performing Ticket Types (Horizontal Bar) */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Best Performing Ticket Types
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={140} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === "ticketsSold"
                        ? `${value} tickets`
                        : name === "revenue"
                          ? `$${value}`
                          : name === "performanceScore"
                            ? `${value} pts`
                            : value,
                      name === "ticketsSold"
                        ? "Tickets Sold"
                        : name === "revenue"
                          ? "Revenue"
                          : name === "performanceScore"
                            ? "Performance Score"
                            : name,
                    ]}
                    labelFormatter={(label) => {
                      const ticket = ticketPerformanceData.find(
                        (t) => t.type === label,
                      );
                      if (ticket) {
                        return `${label} (${ticket.category}) - Popularity: ${ticket.popularity}%`;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="ticketsSold" fill="#3b82f6" />
                  <Bar dataKey="revenue" fill="#10b981" />
                  <Bar dataKey="performanceScore" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Contribution by Ticket Type */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Revenue Contribution by Ticket Type
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueContributionSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="adultRevenue"
                    stroke="#3b82f6"
                    name="Adult Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="childRevenue"
                    stroke="#10b981"
                    name="Child Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="seniorRevenue"
                    stroke="#f59e0b"
                    name="Senior Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="studentRevenue"
                    stroke="#8b5cf6"
                    name="Student Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="groupRevenue"
                    stroke="#ef4444"
                    name="Group Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="promotionalRevenue"
                    stroke="#ec4899"
                    name="Promotional Revenue"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Events Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Events for {selectedGame.name}
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Revenue</th>
                  <th className="px-4 py-2 text-left">Tickets Sold</th>
                  <th className="px-4 py-2 text-left">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {gameEvents.map((event) => (
                  <tr key={event.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{event.name}</td>
                    <td className="px-4 py-2">{event.date}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : event.status === "Sold Out"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">${event.revenue}</td>
                    <td className="px-4 py-2">
                      {event.ticketsSold}/{event.capacity}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="style={{ backgroundColor: 'var(--accent)' }} h-2 rounded-full"
                            style={{ width: `${event.occupancy}%` }}
                          />
                        </div>
                        <span>{event.occupancy}%</span>
                      </div>
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
  min / analytics;
}
