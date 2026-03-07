"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { Calendar, Ticket, DollarSign, PieChart } from "lucide-react";
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

// ==================== Types ====================
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

type BookingData = {
  date: string;
  bookings: number;
};

// ==================== Mock Data ====================
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

// Generate revenue time series (last 30 days)
const generateRevenueTimeSeries = (days = 30): BookingData[] => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, "yyyy-MM-dd"),
      bookings: Math.floor(Math.random() * 50) + 20,
    });
  }
  return data;
};

const mockBookingsTimeSeries = generateRevenueTimeSeries(30);

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
    label: "1d",
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
    const response = await eventService.getDashboard(
      startDate,
      endDate,
      period,
    );
    console.log(response.data);
  };

  // Filter data based on date range
  const filterDataByDateRange = (data: BookingData[], range: DateRange) => {
    if (!range.start || !range.end) return data;
    return data.filter((d) => {
      const date = new Date(d.date);
      return (
        range.start &&
        range.end &&
        isWithinInterval(date, {
          start: range.start as Date,
          end: range.end as Date,
        })
      );
    });
  };

  const filteredBookingsSeries = filterDataByDateRange(
    mockBookingsTimeSeries,
    dateRange,
  );

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
                const selected = ranges.find((r) => r.label === e.target.value);
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
                  className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900`}
                  placeholder="Start date"
                />
                <span className="text-gray-500">to</span>
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
                  className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900`}
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

        {/* Events Content */}
        <div className="space-y-6">
          {/* Events Table */}
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
                {mockEvents.map((event) => (
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
                            : event.status === "Sold Out"
                              ? isDarkTheme
                                ? "bg-red-900/20 text-red-400"
                                : "bg-red-100 text-red-700"
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
