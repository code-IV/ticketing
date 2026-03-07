"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { Calendar, Ticket, DollarSign, PieChart, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, isWithinInterval } from "date-fns";
import { eventService } from "@/services/eventService";

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

type Event = {
  id: string;
  name: string;
  date: string;
  capacity: number;
  ticketsSold: number;
  revenue: number;
  status: boolean; // true = active, false = inactive
};

type DisplayEvent = {
  id: string;
  name: string;
  date: string;
  status: string; // "Active" or "Inactive"
  revenue: number;
  ticketsSold: number;
  capacity: number;
};

type BookingData = {
  date: string;
  bookings: number;
};

// ==================== Components ====================
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

// ==================== Main Component ====================
export default function EventsAnalyticsPage() {
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
  const [customPeriod, setCustomPeriod] = useState("custom");

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const period = dateRange.label === "Custom" ? customPeriod : dateRange.label;
      fetchEvents(
        dateRange.start.toISOString(),
        dateRange.end.toISOString(),
        period,
      );
    }
  }, [dateRange, customPeriod]);

  const fetchEvents = async (
    startDate: string,
    endDate: string,
    period: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventService.getDashboard(
        startDate,
        endDate,
        period,
      );
      if (response.success && Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        setError("Failed to load events");
      }
    } catch (err) {
      setError("Error loading events");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Transform API events to display format
  const displayEvents: DisplayEvent[] = events.map(event => ({
    id: event.id,
    name: event.name,
    date: format(new Date(event.date), "MMM dd, yyyy"),
    status: event.status ? "Active" : "Inactive",
    revenue: parseFloat(event.revenue as any) || 0,
    ticketsSold: parseInt(event.ticketsSold as any) || 0,
    capacity: event.capacity,
  }));

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
            Events Analytics
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
                <input
                  type="text"
                  value={customPeriod}
                  onChange={(e) => setCustomPeriod(e.target.value)}
                  placeholder="Period label"
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
          onClick={() => router.push("/analitics")}
          className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
        >
          ← Back to Analytics Dashboard
        </button>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
              <span className={isDarkTheme ? "text-white" : "text-gray-900"}>Loading events...</span>
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

        {/* Events Table */}
        {!loading && !error && (
          <div className="space-y-6">
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
                      Event
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Date
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Revenue
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkTheme ? "text-gray-400" : "text-gray-700"}`}
                    >
                      Sold/Capacity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`px-4 py-8 text-center ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                        No events found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    displayEvents.map((event) => (
                      <tr
                        key={event.id}
                        className={`cursor-pointer border-t hover:${isDarkTheme ? "bg-gray-800" : "bg-gray-50"} ${isDarkTheme ? "border-gray-700" : "border-gray-100"}`}
                        onClick={() => router.push(`/analitics/events/${event.id}`)}
                      >
                        <td
                          className={`px-4 py-3 font-medium ${isDarkTheme ? "text-white" : ""}`}
                        >
                          {event.name}
                        </td>
                        <td
                          className={`px-4 py-3 ${isDarkTheme ? "text-gray-300" : ""}`}
                        >
                          {event.date}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.status === "Active"
                                ? isDarkTheme
                                  ? "bg-green-900/20 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : isDarkTheme
                                  ? "bg-gray-900/20 text-gray-400"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 ${isDarkTheme ? "text-gray-300" : ""}`}
                        >
                          ${event.revenue.toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-3 ${isDarkTheme ? "text-gray-300" : ""}`}
                        >
                          {event.ticketsSold}/{event.capacity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}