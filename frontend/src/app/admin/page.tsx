"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { DashboardStats } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import Link from "next/link";
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "ADMIN") {
        router.push("/");
      } else {
        loadDashboard();
      }
    }
  }, [user, authLoading]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      setStats(response.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard Unavailable
          </h2>
          <p className="text-gray-600">
            {error || "Unable to load dashboard data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/games"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Games</h1>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage events, bookings, and view reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Total Revenue
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {parseFloat(stats.revenue.total_revenue).toFixed(2)} ETB
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Today's Revenue
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {parseFloat(stats.revenue.today_revenue).toFixed(2)} ETB
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Total Transactions
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats.revenue.total_transactions}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Today's Transactions
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats.revenue.today_transactions}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </CardHeader>
            <CardBody className="space-y-2">
              <button
                onClick={() => router.push("/admin/events")}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-blue-900">Manage Events</p>
                <p className="text-sm text-blue-700">Create and edit events</p>
              </button>
              <button
                onClick={() => router.push("/admin/bookings")}
                className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-green-900">View Bookings</p>
                <p className="text-sm text-green-700">Manage all bookings</p>
              </button>
              <button
                onClick={() => router.push("/admin/reports")}
                className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-purple-900">Reports</p>
                <p className="text-sm text-purple-700">View revenue reports</p>
              </button>
              <button
                onClick={() => router.push("/admin/users")}
                className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-orange-900">Manage Users</p>
                <p className="text-sm text-orange-700">View and manage users</p>
              </button>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Recent Events</h2>
            </CardHeader>
            <CardBody>
              {stats.recentEvents && stats.recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {event.event_date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {event.tickets_sold} / {event.capacity}
                        </p>
                        <p className="text-xs text-gray-600">tickets sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No recent events
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
          </CardHeader>
          <CardBody>
            {stats.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {booking.booking_reference}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.event_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {parseFloat(booking.total_amount).toFixed(2)} ETB
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.booking_status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.booking_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.booking_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">
                No recent bookings
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
