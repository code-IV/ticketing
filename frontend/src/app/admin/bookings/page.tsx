"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Ticket,
  DollarSign,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { gameService } from "@/services/gameService";

// ==================== Types ====================
type BookingSummary = {
  total_bookings: number;
  avg_bookings_per_day: number;
  peak_bookings_day: number;
  total_revenue: string;
};

type DailyBooking = {
  date: string;
  tickets: string;
  revenue: string;
};

type EventBooking = {
  id: string;
  event: string;
  "tickets bought": string;
  capacity: number;
  revenue: string;
};

type TopGameEntry = {
  id: string;
  game: string;
  revenue: string;
  topTicketType: string;
  topTicketPrice: string;
  topTicketSold: string;
};

type GameAnalyticsData = {
  bookingData: BookingSummary[];
  gameBookingData: DailyBooking[];
  eventBookingData: EventBooking[];
  topGameData: TopGameEntry[];
};

type ApiResponse = {
  success: boolean;
  period: string;
  data: GameAnalyticsData;
};

// ==================== Helper ====================
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "MMM dd");
  } catch {
    return dateString;
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
export default function GameDetailPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<GameAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchGameAnalytics();
    }
  }, [id]);

  const fetchGameAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use last 7 days as default period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const response = await gameService.getAnalytics(
        id,
        startDate.toISOString(),
        endDate.toISOString(),
        "7d"
      );
      
      // The response should match the structure you provided
      setData(response.data.data);
    } catch (err) {
      console.error("Failed to fetch game analytics:", err);
      setError("Failed to load game data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}>
        <p className={isDarkTheme ? "text-white" : "text-gray-900"}>Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className={`text-2xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            {error || "Game not found"}
          </h1>
          <button
            onClick={() => router.push("/analitics/games")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const summary = data.bookingData[0] || {
    total_bookings: 0,
    avg_bookings_per_day: 0,
    peak_bookings_day: 0,
    total_revenue: "0",
  };

  // Prepare daily chart data
  const dailyData = data.gameBookingData.map(item => ({
    date: formatDate(item.date),
    tickets: parseInt(item.tickets),
    revenue: parseFloat(item.revenue),
  }));

  // Filter topGameData for this specific game (since the API might return multiple games)
  const gameTopData = data.topGameData.filter(item => item.id === id);
  
  // Group by ticket type for display
  const ticketTypeMap = new Map();
  gameTopData.forEach(item => {
    const type = item.topTicketType;
    if (!ticketTypeMap.has(type)) {
      ticketTypeMap.set(type, {
        type,
        sold: 0,
        revenue: 0,
        price: parseFloat(item.topTicketPrice),
      });
    }
    const entry = ticketTypeMap.get(type);
    entry.sold += parseInt(item.topTicketSold);
    entry.revenue += parseFloat(item.revenue);
  });
  
  const ticketTypeData = Array.from(ticketTypeMap.values());

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Game Analytics
          </h1>
          <button
            onClick={() => router.push("/analitics/games")}
            className={`flex items-center gap-2 text-sm ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            <ChevronLeft size={16} /> Back to Games
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            title="Total Revenue"
            value={`ETB ${parseFloat(summary.total_revenue).toLocaleString()}`}
            icon={DollarSign}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Total Bookings"
            value={summary.total_bookings}
            icon={Ticket}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Avg Bookings/Day"
            value={summary.avg_bookings_per_day}
            icon={TrendingUp}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Peak Day Bookings"
            value={summary.peak_bookings_day}
            icon={Calendar}
            isDarkTheme={isDarkTheme}
          />
        </div>

        {/* Daily Trends Chart */}
        <div className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            Daily Bookings & Revenue (Last 7 days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="tickets" stroke="#3b82f6" name="Tickets" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue (ETB)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Events Table */}
        {data.eventBookingData.length > 0 && (
          <div className={`rounded-xl overflow-hidden ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
            <div className={`px-6 py-4 border-b ${isDarkTheme ? "border-gray-700 bg-[#1a1a1a]" : "border-gray-200 bg-gray-50"}`}>
              <h3 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Events for this Game
              </h3>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead className={isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}>
                  <tr>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Event</th>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Tickets Bought</th>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Capacity</th>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Revenue</th>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {data.eventBookingData.map((event) => {
                    const tickets = parseInt(event["tickets bought"]);
                    const occupancy = (tickets / event.capacity) * 100;
                    return (
                      <tr key={event.id} className={`border-t ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}>
                        <td className={`px-4 py-2 font-medium ${isDarkTheme ? "text-white" : ""}`}>{event.event}</td>
                        <td className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}>{tickets}</td>
                        <td className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}>{event.capacity}</td>
                        <td className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}>ETB {parseFloat(event.revenue).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-16 rounded-full h-2 ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}>
                              <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${Math.min(occupancy, 100)}%` }}
                              />
                            </div>
                            <span className={isDarkTheme ? "text-gray-300" : ""}>
                              {occupancy.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ticket Type Breakdown */}
        {ticketTypeData.length > 0 && (
          <div className={`rounded-xl overflow-hidden ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
            <div className={`px-6 py-4 border-b ${isDarkTheme ? "border-gray-700 bg-[#1a1a1a]" : "border-gray-200 bg-gray-50"}`}>
              <h3 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
                Ticket Type Performance
              </h3>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead className={isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}>
                  <tr>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Ticket Type</th>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Sold</th>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Revenue</th>
                    <th className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}>Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketTypeData.map((ticket, idx) => (
                    <tr key={idx} className={`border-t ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}>
                      <td className={`px-4 py-2 font-medium ${isDarkTheme ? "text-white" : ""}`}>{ticket.type}</td>
                      <td className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}>{ticket.sold}</td>
                      <td className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}>ETB {ticket.revenue.toLocaleString()}</td>
                      <td className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}>ETB {ticket.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}