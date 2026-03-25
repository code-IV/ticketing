"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import {
  Ticket,
  DollarSign,
  TrendingUp,
  Activity,
  Loader2,
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
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays, isWithinInterval } from "date-fns";
import { bookingService } from "@/services/bookingService";

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

// ==================== Types ====================
type BookingData = {
  date: string;
  tickets: number;
  revenue: number;
};

type GameBookingData = {
  game: string;
  tickets: number;
  revenue: number;
  sessions: number;
};

type TopGameData = {
  game: string;
  tickets: number;
  revenue: number;
  topTicketType: string;
  topTicketPrice: number;
  topTicketSold: number;
};

type EventBookingData = {
  event: string;
  booked: number;
  capacity: number;
  occupancy: number;
  revenue: number;
};

// ==================== Components ====================
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
        {change && (
          <p
            className={`text-sm font-medium ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}
          >
            {change}
          </p>
        )}
      </div>
      <div
        className={`p-3 rounded-lg ${isDarkTheme ? "bg-indigo-900/20" : "bg-blue-50"}`}
      >
        <Icon
          className={`w-6 h-6 ${isDarkTheme ? "text-indigo-400" : ""}`}
          style={{ color: "var(--accent)" }}
        />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function BookingAnalyticsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>({
    label: "7d",
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customPeriod, setCustomPeriod] = useState("5");
  
  // API Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      let period = dateRange.label === "Custom" ? customPeriod : dateRange.label;
      
      // Auto-add 'd' suffix for numeric periods
      if (dateRange.label === "Custom" && /^\d+$/.test(period)) {
        period = period + "d";
      }
      
      loadEvent(
        dateRange.start.toISOString(),
        dateRange.end.toISOString(),
        period,
      );
    }
  }, [dateRange, customPeriod]);

  const loadEvent = async (
    startDate: string,
    endDate: string,
    period: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug logging
      console.log('API Call Data:', {
        startDate,
        endDate,
        period,
        dateRangeLabel: dateRange.label
      });
      
      const response = await bookingService.getAnalytics(
        startDate,
        endDate,
        period,
      );
      
      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Error loading analytics data');
      console.error('Analytics API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Data transformation functions
  const transformGameBookingData = (apiData: any[]): BookingData[] => {
    return apiData.map(item => ({
      date: format(new Date(item.date), "yyyy-MM-dd"),
      tickets: parseInt(item.tickets) || 0,
      revenue: parseFloat(item.revenue) || 0
    }));
  };

  const transformEventBookingData = (apiData: any[]): EventBookingData[] => {
    return apiData.map(item => {
      const booked = parseInt(item["tickets bought"]) || 0;
      const capacity = parseInt(item.capacity) || 0;
      const occupancy = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
      
      return {
        event: item.event,
        booked,
        capacity,
        occupancy,
        revenue: parseFloat(item.revenue) || 0
      };
    });
  };

  const transformTopGameData = (apiData: any[]): TopGameData[] => {
    return apiData.map(item => ({
      game: item.game,
      tickets: parseInt(item.topTicketSold) || 0,
      revenue: parseFloat(item.revenue) || 0,
      topTicketType: item.topTicketType,
      topTicketPrice: parseFloat(item.topTicketPrice) || 0,
      topTicketSold: parseInt(item.topTicketSold) || 0
    }));
  };

  // Get transformed data from API or fallback to empty arrays
  const transformedGameBookingData = analyticsData ? transformGameBookingData(analyticsData.gameBookingData || []) : [];
  const transformedEventBookingData = analyticsData ? transformEventBookingData(analyticsData.eventBookingData || []) : [];
  const transformedTopGameData = analyticsData ? transformTopGameData(analyticsData.topGameData || []) : [];
  
  // Calculate KPIs from API data
  const bookingStats = analyticsData?.bookingData?.[0] || {};
  const totalBookings = parseInt(bookingStats.total_bookings) || 0;
  const avgDailyBookings = parseInt(bookingStats.avg_bookings_per_day) || 0;
  const peakDayBookings = parseInt(bookingStats.peak_bookings_day) || 0;
  const totalRevenue = parseFloat(bookingStats.total_revenue) || 0;

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
            Booking Analytics
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
                    label: "7d",
                    display: "Last 7 days",
                    start: subDays(new Date(), 7),
                    end: new Date(),
                  },
                  {
                    label: "30d",
                    display: "Last 30 days",
                    start: subDays(new Date(), 30),
                    end: new Date(),
                  },
                  {
                    label: "90d",
                    display: "Last 90 days",
                    start: subDays(new Date(), 90),
                    end: new Date(),
                  },
                  {
                    label: "Custom",
                    display: "Custom",
                    start: null,
                    end: null,
                  },
                ];
                const selected = ranges.find((r) => r.label === e.target.value);
                if (selected) {
                  if (selected.label === "Custom") {
                    setIsCustomMode(true);
                    // Initialize custom inputs with the current date range (from the preset)
                    if (dateRange.start && dateRange.end) {
                      setCustomStartDate(format(dateRange.start, "yyyy-MM-dd"));
                      setCustomEndDate(format(dateRange.end, "yyyy-MM-dd"));
                    }
                    // Reset custom period to default
                    setCustomPeriod("custom");
                    // Set the date range to custom with the same dates (so the API call uses the same range initially)
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
                      // Create UTC date to avoid timezone issues
                      const startDate = new Date(e.target.value + 'T00:00:00.000Z');
                      const endDate = new Date(customEndDate + 'T00:00:00.000Z');
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
                  placeholder="Start date"
                />
                <span className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    if (customStartDate) {
                      // Create UTC date to avoid timezone issues
                      const startDate = new Date(customStartDate + 'T00:00:00.000Z');
                      const endDate = new Date(e.target.value + 'T00:00:00.000Z');
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
                  placeholder="End date"
                />
                {/* Period input */}
                      <input
        type="number"
        value={customPeriod}
        onChange={(e) => setCustomPeriod(e.target.value)}
        placeholder="1"
        className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm w-32 ${
          isDarkTheme
            ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
        }`}
      />
              </div>
            )}
          </div>
        </div>

        {/* Back Navigation */}
        <button
          onClick={() => router.push("/admin/analitics")}
          className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
        >
          ← Back to Analytics Dashboard
        </button>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
              <span className={isDarkTheme ? "text-white" : "text-gray-900"}>Loading analytics data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={`rounded-xl p-6 mb-6 ${isDarkTheme ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <p className={`font-semibold ${isDarkTheme ? "text-red-400" : "text-red-800"}`}>Error loading data</p>
                <p className={`text-sm ${isDarkTheme ? "text-red-300" : "text-red-600"}`}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content - Only show when not loading and no error */}
        {!loading && !error && analyticsData && (
          <>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Tickets Sold"
            value={totalBookings.toLocaleString()}
            icon={Ticket}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Avg Daily Bookings"
            value={avgDailyBookings.toLocaleString()}
            icon={Activity}
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Peak Day"
            value={`${peakDayBookings} tickets`}
            icon={TrendingUp}
            change={dateRange.label}
            changeType="positive"
            isDarkTheme={isDarkTheme}
          />
          <KpiCard
            title="Revenue from Bookings"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            isDarkTheme={isDarkTheme}
          />
        </div>

        {/* Total Tickets Bought Graph */}
        <div
          className={`rounded-xl p-6 mb-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Total Tickets Bought Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transformedGameBookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) =>
                  format(new Date(date as string), "MMM dd, yyyy")
                }
                formatter={(value: any) => [`${value} tickets`, "Tickets Sold"]}
              />
              <Line
                type="monotone"
                dataKey="tickets"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event Booking with Occupancy Graphs */}
        <div
          className={`rounded-xl p-6 mb-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Event Booking vs Capacity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={transformedEventBookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
              <Bar dataKey="booked" fill="#3b82f6" name="Booked" />
              <Line
                type="monotone"
                dataKey="occupancy"
                stroke="#f97316"
                strokeWidth={2}
                name="Occupancy %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {/* Summary Table */}
        <div
          className={`rounded-xl p-6 mt-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Booking Summary by Game (Descending Order)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                className={`${isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}`}
              >
                <tr>
                  <th
                    className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Rank
                  </th>
                  <th
                    className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Game
                  </th>
                  <th
                    className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Total Tickets Sold
                  </th>
                  <th
                    className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Revenue
                  </th>
                  <th
                    className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Ticket Type
                  </th>
                  <th
                    className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Ticket Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {transformedTopGameData
                  .sort((a, b) => b.tickets - a.tickets)
                  .map((game, index) => (
                    <tr
                      key={index}
                      className={`border-t ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            index === 0
                              ? isDarkTheme
                                ? "bg-yellow-900/20 text-yellow-400"
                                : "bg-yellow-100 text-yellow-800"
                              : index === 1
                                ? isDarkTheme
                                  ? "bg-gray-900/20 text-gray-400"
                                  : "bg-gray-100 text-gray-800"
                                : index === 2
                                  ? isDarkTheme
                                    ? "bg-orange-900/20 text-orange-400"
                                    : "bg-orange-100 text-orange-800"
                                  : isDarkTheme
                                    ? "bg-blue-900/20 text-blue-400"
                                    : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${isDarkTheme ? "text-white" : ""}`}
                      >
                        {game.game}
                      </td>
                      <td className={`px-4 py-3 font-bold text-accent`}>
                        {game.tickets.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${isDarkTheme ? "text-green-400" : "text-green-600"}`}
                      >
                        ${game.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkTheme ? "bg-accent/20 text-accent" : "bg-accent/20 text-accent"}`}
                        >
                          {game.topTicketType}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${isDarkTheme ? "text-gray-300" : ""}`}
                      >
                        ${game.topTicketPrice}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}