"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { Booking, Ticket } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import {
  Calendar,
  Clock,
  CreditCard,
  Download,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedPromise = use(params);
  const id = resolvedPromise.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      loadBookingDetails();
    }
  }, [user, authLoading, id]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const [bookingRes, ticketsRes] = await Promise.all([
        bookingService.getBookingById(id),
        bookingService.getBookingTickets(id),
      ]);
      setBooking(bookingRes.data?.booking || null);
      setTickets(ticketsRes.data?.tickets || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
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
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The booking you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/my-bookings")}>
            Back to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {booking.booking_status === "confirmed" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900">
                Booking Confirmed!
              </h3>
              <p className="text-sm text-green-700">
                Your tickets are ready. Show the QR codes at the park entrance.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {booking.event_name}
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Booking Reference:{" "}
                  <span className="font-semibold">
                    {booking.booking_reference}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}
                >
                  {booking.booking_status.toUpperCase()}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.payment_status)}`}
                >
                  {booking.payment_status.toUpperCase()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Event Date</p>
                  <p className="text-gray-600">
                    {booking.event_date
                      ? format(
                          new Date(booking.event_date),
                          "EEEE, MMMM dd, yyyy",
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Time</p>
                  <p className="text-gray-600">
                    {booking.start_time} - {booking.end_time}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Total Amount</p>
                  <p className="text-gray-600 font-semibold">
                    {parseFloat(booking.total_amount).toFixed(2)} ETB
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Payment Method</p>
                  <p className="text-gray-600 capitalize">
                    {booking.payment_method?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>

            {booking.items && booking.items.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Ticket Breakdown
                </h3>
                <div className="space-y-2">
                  {booking.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm border-b border-gray-200 pb-2"
                    >
                      <span className="text-gray-700">
                        {item.quantity}x {item.ticket_type_name}
                      </span>
                      <span className="font-medium">
                        {parseFloat(item.subtotal).toFixed(2)} ETB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>
                Booked on:{" "}
                {format(new Date(booking.booked_at), "MMMM dd, yyyy HH:mm")}
              </p>
              {booking.cancelled_at && (
                <p className="text-red-600">
                  Cancelled on:{" "}
                  {format(
                    new Date(booking.cancelled_at),
                    "MMMM dd, yyyy HH:mm",
                  )}
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {tickets.length > 0 && booking.booking_status === "confirmed" && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-900">Your Tickets</h2>
              <p className="text-sm text-gray-600 mt-1">
                Show these QR codes at the park entrance
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-6 text-center"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Ticket #{index + 1}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {ticket.ticket_type_name}
                    </p>
                    <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-300">
                      <QRCodeSVG value={ticket.qr_token || ticket.qr_data} size={200} />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 font-mono">
                      {ticket.ticket_code}
                    </p>
                    {ticket.is_used && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        ✓ Used on{" "}
                        {ticket.used_at
                          ? format(
                              new Date(ticket.used_at),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Button variant="secondary" onClick={() => window.print()}>
                  <Download className="h-4 w-4 mr-2" />
                  Print Tickets
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="mt-6 flex gap-4">
          <Button
            variant="secondary"
            onClick={() => router.push("/my-bookings")}
          >
            Back to My Bookings
          </Button>
          <Button variant="secondary" onClick={() => router.push("/events")}>
            Browse More Events
          </Button>
        </div>
      </div>
    </div>
  );
}
