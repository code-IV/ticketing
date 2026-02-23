import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { adminService } from "@/services/adminService";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";

// Specific object for the Registration Trend Line Chart
interface RegistrationTrend {
  date: string; // ISO Date string from Postgres
  new_users: number | string;
}

// Specific object for the Role Distribution Pie Chart
interface RoleBreakdown {
  role: string;
  count: number | string;
  percentage: string; // e.g., "12.50"
}

// Specific object for Active/Inactive status
interface UserStatus {
  is_active: boolean;
  count: number | string;
}

// Specific object for the Booking Participation KPI
interface BookingParticipation {
  users_with_bookings: number;
  total_users: number;
  percentage: number | string;
}

// The complete response shape from your API
export interface UserAnalyticsData {
  registrationData: RegistrationTrend[];
  roleBreakdown: RoleBreakdown[];
  activeStatus: UserStatus[];
  bookingParticipation: BookingParticipation;
}

// The standard API wrapper you use
export interface UserAnalyticsResponse {
  success: boolean;
  message: string;
  data: UserAnalyticsData;
}

export default function UserAnalyticsTab() {
  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
  const [data, setAnalyticsData] = useState<UserAnalyticsData>();

  const fetchAnalytics = async () => {
    try {
      const res = await adminService.getUserAnalytics();
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Failed to load insights", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const roleData =
    data?.roleBreakdown?.map((item) => ({
      name: item.role,
      value: Number(item.count),
      percentage: item.percentage,
    })) || [];

  const renderColorfulLegendText = (value: string, entry: any) => {
    const { payload } = entry;
    return (
      <span className="text-xs font-bold text-gray-700 mr-4">
        {value.toUpperCase()}:{" "}
        <span className="text-blue-600">{payload.value}</span>
      </span>
    );
  };

  return (
    <>
      {data ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* 1. Top Level KPI: Booking Participation */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-bold uppercase tracking-wider">
              Booking Engagement
            </p>
            <div className="flex items-end gap-4 mt-2">
              <h3 className="text-4xl font-black">
                {data.bookingParticipation?.percentage}%
              </h3>
              <p className="text-blue-100 pb-1">
                {data.bookingParticipation?.users_with_bookings} of{" "}
                {data.bookingParticipation?.total_users} active users have made
                bookings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2. Registration Trend (Line Chart) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">
                Registration Trend
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.registrationData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickFormatter={(str) =>
                        new Date(str).toLocaleDateString()
                      }
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="new_users"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Role Breakdown (Pie Chart) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">
                Role Distribution
              </h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                {roleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Legend
                        verticalAlign="top"
                        align="center"
                        iconType="circle"
                        formatter={renderColorfulLegendText}
                        wrapperStyle={{
                          paddingTop: "0px",
                          paddingBottom: "20px",
                        }}
                      />
                      <Pie
                        data={roleData} // Use the mapped numeric data here
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        // Adding a small animation delay helps render correctly
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {roleData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No role data available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <AnalyticsSkeleton />
      )}
    </>
  );
}
