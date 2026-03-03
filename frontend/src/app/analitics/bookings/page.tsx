"use client";

import { useEffect, useState } from "react";
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
} from "recharts";
import { format, subDays } from "date-fns";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import { BookingAnalytics, BookingData } from "@/types";
import { bookingService } from "@/services/bookingService";

// ==================== Components ====================
const KpiCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
}: {
  title: string;
  value: string;
  icon: any;
  change?: string;
  changeType?: "positive" | "negative";
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p
            className={`text-sm font-medium ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}
          >
            {change}
          </p>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function BookingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    label: "7d",
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [bookingAnalytics, setAnalytics] = useState<BookingAnalytics | null>(
    null,
  );

  useEffect(() => {
    populateAnalytics(
      dateRange.label,
      format(dateRange.start, "yyyy-MM-dd"),
      format(dateRange.end, "yyyy-MM-dd"),
    );
  }, [dateRange]);

  const populateAnalytics = async (
    label: string,
    start?: string,
    end?: string,
  ) => {
    try {
      setLoading(true);
      const response = await bookingService.getAnalytics(label, start, end);
      setAnalytics(response.data || null);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Data from API ---
  const bookingSeries = bookingAnalytics?.bookingData || [];
  const eventData = bookingAnalytics?.eventBookingData || [];
  const topGames = bookingAnalytics?.topGameData || [];
  console.log("topGameData:", topGames);
  // Calculate KPIs based on actual data
  const totalBookings = bookingSeries?.reduce(
    (sum, day) => sum + Number(day.tickets),
    0,
  );
  const totalRevenue = bookingSeries.reduce(
    (sum, day) => sum + Number(day.revenue),
    0,
  );
  const avgDailyBookings =
    bookingSeries.length > 0
      ? Math.round(totalBookings / bookingSeries.length)
      : 0;

  const peakDay =
    bookingSeries.length > 0
      ? [...bookingSeries].sort((a, b) => b.tickets - a.tickets)[0]
      : { tickets: 0, date: new Date().toISOString() };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <AnalyticsHeader
          title="Booking Analytics"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard
                title="Total Tickets Sold"
                value={totalBookings.toLocaleString()}
                icon={Ticket}
              />
              <KpiCard
                title="Avg Daily Bookings"
                value={avgDailyBookings.toLocaleString()}
                icon={Activity}
              />
              <KpiCard
                title="Peak Day"
                value={`${peakDay.tickets} tickets`}
                icon={TrendingUp}
                change={
                  peakDay?.date ? format(new Date(peakDay.date), "MMM dd") : "-"
                }
                changeType="positive"
              />
              <KpiCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                icon={DollarSign}
              />
            </div>

            {/* Total Tickets Bought Graph */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Total Tickets Bought Over Time
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM dd")}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) =>
                        format(new Date(date as string), "MMM dd, yyyy")
                      }
                      formatter={(value: any) => [
                        `${value} tickets`,
                        "Tickets",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="tickets"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Event Booking vs Capacity */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Event Booking vs Capacity
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={eventData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="event"
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="capacity"
                      fill="#e5e7eb"
                      name="Capacity"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="booked"
                      fill="#3b82f6"
                      name="Booked"
                      radius={[4, 4, 0, 0]}
                    />
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
            </div>

            {/* Summary Table */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Summary by Game
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Game
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Tickets Sold
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Revenue
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Top Ticket Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGames &&
                      topGames.map((game, index) => (
                        <tr
                          key={index}
                          className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                index === 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {game.game}
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-600">
                            {game.topTicketSold.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-green-600">
                            ${game.revenue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] uppercase font-bold">
                              {game.topTicketType}
                            </span>
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
