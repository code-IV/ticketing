"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
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
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import { DateRange } from "@/components/analytics/DateRangePicker";
import { dashboardService } from "@/services/dashboardService";

// ==================== Types ====================
type RevenueData = {
  date: string;
  revenue: number;
};

// ==================== Mock Data ====================
const generateRevenueTimeSeries = (days = 30): RevenueData[] => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, "yyyy-MM-dd"),
      revenue: Math.floor(Math.random() * 5000) + 2000,
    });
  }
  return data;
};

const mockRevenueTimeSeries = generateRevenueTimeSeries(30);

const revenueByTicketType = [
  { type: "Adult", revenue: 45000 },
  { type: "Child", revenue: 28000 },
  { type: "Senior", revenue: 15000 },
  { type: "Student", revenue: 22000 },
  { type: "Group", revenue: 15000 },
];

const COLORS = ["#3b82f6", "#f97316", "#10b981", "#ef4444", "#8b5cf6"];

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
            className={`text-sm font-medium ${
              changeType === "positive" ? "text-green-600" : "text-red-600"
            }`}
          >
            {change}
          </p>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-accent" />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    label: "1d",
    start: subDays(new Date(), 14),
    end: new Date(),
  });

  useEffect(() => {
    loadDashboard(
      dateRange.start.toISOString(),
      dateRange.end.toISOString(),
      dateRange.label,
    );
  }, []);

  const loadDashboard = async (start: string, end: string, label: string) => {
    const response = await dashboardService.getDashboardRevenue(
      start,
      end,
      label,
    );
    console.log(response);
  };

  // Filter data based on date range
  const filterDataByDateRange = (data: RevenueData[], range: DateRange) => {
    if (!range.start || !range.end) return data;
    return data.filter((d) => {
      const date = new Date(d.date);
      return isWithinInterval(date, { start: range.start, end: range.end });
    });
  };

  const filteredRevenueSeries = filterDataByDateRange(
    mockRevenueTimeSeries,
    dateRange,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <AnalyticsHeader
          title="Revenue Analytics"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Revenue Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Revenue" value="$125,000" icon={DollarSign} />
            <KpiCard
              title="Avg Revenue/Booking"
              value="$39.06"
              icon={TrendingUp}
            />
            <KpiCard
              title="Projected (this month)"
              value="$132,000"
              icon={BarChart3}
              change="+5.6%"
              changeType="positive"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Revenue Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredRevenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Revenue by Ticket Type
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={revenueByTicketType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.type}: $${entry.revenue}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {revenueByTicketType.map((entry, index) => (
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
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Revenue by Game
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { game: "Cyber Realm", revenue: 85000 },
                  { game: "Speed Racer", revenue: 42000 },
                  { game: "Fantasy Quest", revenue: 120000 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
