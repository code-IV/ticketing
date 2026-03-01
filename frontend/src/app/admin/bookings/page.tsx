"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { Booking } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Eye, XCircle, Filter } from "lucide-react";
import { format } from "date-fns";

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "ADMIN") {
        router.push("/");
      } else {
        loadBookings();
      }
    }
  }, [user, authLoading, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllBookings(
        1,
        100,
        statusFilter || undefined,
      );
      setBookings(response.data.bookings || []);
    } catch (err: any) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(bookingId);
    try {
      await adminService.cancelBooking(bookingId);
      await loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manage Bookings
          </h1>
          <p className="text-lg text-gray-600">
            View and manage all customer bookings
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-sm text-gray-600">
            {bookings.length} bookings
          </span>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">All Bookings</h2>
          </CardHeader>
          <CardBody>
            {bookings.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No bookings found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {booking.booking_reference}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {(booking as any).customer_name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.type === "EVENT"
                            ? booking.event_name
                            : "Game bundle"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.type === "EVENT" && booking.event_date
                            ? format(
                                new Date(booking.event_date),
                                "MMM dd, yyyy",
                              )
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {parseFloat(booking.total_amount).toFixed(2)} ETB
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.booking_status)}`}
                          >
                            {booking.booking_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                router.push(`/bookings/${booking.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.booking_status === "CONFIRMED" && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                isLoading={cancelling === booking.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
