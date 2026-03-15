"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter, useParams } from "next/navigation";
import { Ticket, DollarSign, ChevronLeft, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
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
import { eventService } from "@/services/eventService";

// Types
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

type RevenueData = { date: string; revenue: number };
type BookingData = { date: string; bookings: number };
type TicketTypeRevenue = { type: string; revenue: number };
type TicketTypeBooking = { type: string; sold: number };
type TicketTypeTableRow = {
  id: string;
  type: string;
  avgPrice: string;
  sold: string;
  revenue: string;
};

type AnalyticsData = {
  name: string;
  revenue: number;
  ticketsSold: number;
  capacity: number;
  revenueTrend: RevenueData[];
  bookingTrend: BookingData[];
  revenueByTicketType: TicketTypeRevenue[];
  bookingsByTicketType: TicketTypeBooking[];
  ticketTypesTable: TicketTypeTableRow[];
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

export default function EventDetailPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const eventId = id; // keep as string (UUID)

  const [dateRange, setDateRange] = useState<DateRange>({
    label: "Last 7 days",
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

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    name: "",
    revenue: 0,
    ticketsSold: 0,
    capacity: 0,
    revenueTrend: [],
    bookingTrend: [],
    revenueByTicketType: [],
    bookingsByTicketType: [],
    ticketTypesTable: [],
  });
  const [loading, setLoading] = useState(false);

  // Fetch analytics whenever date range changes
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await eventService.getAnalytics(
          eventId, // string UUID
          dateRange.start!.toISOString(),
          dateRange.end!.toISOString(),
          dateRange.label,
        );
        const apiData = response.data?.data;
        if (apiData) {
          setAnalytics({
            name: apiData.name || "",
            revenue: apiData.revenue || 0,
            ticketsSold: apiData.ticketsSold || 0,
            capacity: apiData.capacity || 0,
            revenueTrend: apiData.revenueTrend || [],
            bookingTrend: apiData.bookingTrend || [],
            revenueByTicketType: apiData.revenueByTicketType || [],
            bookingsByTicketType: apiData.bookingsByTicketType || [],
            ticketTypesTable: apiData.ticketTypesTable || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange, eventId]);

  // Use a generic title – replace with a real event name fetch if available
  const eventName = `Event ${analytics.name?.substring(0, 8)}...`; // temporary

  return (
    <div
      className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header with date picker */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1
              className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
            >
              {eventName} Analytics
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
                    { label: "Custom", start: null, end: null },
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
                      setDateRange({
                        label: "Custom",
                        start: new Date(e.target.value),
                        end: new Date(customEndDate),
                      });
                    }}
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                      isDarkTheme
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                    }`}
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
                      setDateRange({
                        label: "Custom",
                        start: new Date(customStartDate),
                        end: new Date(e.target.value),
                      });
                    }}
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                      isDarkTheme
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-400"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => router.push("/admin/analitics/events")}
            className={`flex items-center gap-2 text-sm ${
              isDarkTheme
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ChevronLeft size={16} /> Back to Events
          </button>

          {/* Loading indicator */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2
                className={`w-8 h-8 animate-spin ${isDarkTheme ? "text-white" : "text-gray-900"}`}
              />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KpiCard
                  title="Revenue"
                  value={`$${analytics.revenue.toLocaleString()}`}
                  icon={DollarSign}
                  isDarkTheme={isDarkTheme}
                />
                <KpiCard
                  title="Tickets Sold"
                  value={`${analytics.ticketsSold}/${analytics.capacity}`}
                  icon={Ticket}
                  isDarkTheme={isDarkTheme}
                />
              </div>

              {/* Revenue & Bookings Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <div
                  className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <h3
                    className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                  >
                    Revenue Trend ({dateRange.label})
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Booking Trend Chart */}
                <div
                  className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <h3
                    className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                  >
                    Booking Trend ({dateRange.label})
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.bookingTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#f97316"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ticket Type Pie Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Ticket Type */}
                <div
                  className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <h3
                    className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                  >
                    Revenue by Ticket Type ({dateRange.label})
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={analytics.revenueByTicketType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.type}: $${entry.revenue.toLocaleString()}`
                        }
                        outerRadius={80}
                        dataKey="revenue"
                      >
                        {analytics.revenueByTicketType.map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][
                                  index % 4
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                {/* Bookings by Ticket Type */}
                <div
                  className={`rounded-xl p-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <h3
                    className={`font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                  >
                    Bookings by Ticket Type ({dateRange.label})
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={analytics.bookingsByTicketType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.type}: ${entry.sold} tickets`
                        }
                        outerRadius={80}
                        dataKey="sold"
                      >
                        {analytics.bookingsByTicketType.map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                ["#f97316", "#ef4444", "#10b981", "#3b82f6"][
                                  index % 4
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ticket Types Table */}
              <div
                className={`rounded-xl overflow-hidden ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div
                  className={`px-4 py-3 border-b ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}
                >
                  <h3
                    className={`font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                  >
                    Ticket Types
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead
                    className={isDarkTheme ? "bg-[#1a1a1a]" : "bg-gray-50"}
                  >
                    <tr>
                      <th
                        className={`px-4 py-2 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                      >
                        Type
                      </th>
                      <th
                        className={`px-4 py-2 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                      >
                        Price
                      </th>
                      <th
                        className={`px-4 py-2 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                      >
                        Sold
                      </th>
                      <th
                        className={`px-4 py-2 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                      >
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.ticketTypesTable.map((ticket, index) => (
                      <tr
                        key={ticket.id || index}
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
                          ${parseFloat(ticket.avgPrice).toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}
                        >
                          {ticket.sold}
                        </td>
                        <td
                          className={`px-4 py-2 ${isDarkTheme ? "text-gray-300" : ""}`}
                        >
                          ${parseFloat(ticket.revenue).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
