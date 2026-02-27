'use client';

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { gameTicketService } from "@/services/gameTicketService";
import { GameTicketDetail } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import {
  Calendar,
  Clock,
  CreditCard,
  Download,
  CheckCircle,
  Gamepad2,
  Ticket,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export default function GameTicketDetailsPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.gameId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [gameData, setGameData] = useState<any>(null);
  const [tickets, setTickets] = useState<GameTicketDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      loadGameTicketDetails();
    }
  }, [user, authLoading, gameId]);

  const loadGameTicketDetails = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await gameTicketService.getGameTicketsDetails(gameId);
      setGameData(response.game);
      setTickets(response.tickets || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load game ticket details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "PENDING_PAYMENT":
        return "bg-yellow-100 text-yellow-800";
      case "USED":
        return "bg-blue-100 text-blue-800";
      case "EXPIRED":
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "AVAILABLE":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING_PAYMENT":
        return <AlertCircle className="w-4 h-4" />;
      case "USED":
        return <Clock className="w-4 h-4" />;
      case "EXPIRED":
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game ticket details...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Game Tickets Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The game tickets you're looking for don't exist.
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
        {tickets && tickets.length > 0 && tickets.some(t => t.ticket_game_status === 'ACTIVE') && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900">
                Game Tickets Ready!
              </h3>
              <p className="text-sm text-green-700">
                Your game tickets are ready. Show the QR codes at the game entrance.
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
                  {gameData?.name}
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Game Tickets:{" "}
                  <span className="font-semibold">
                    {tickets && tickets.length} Ticket{tickets && tickets.length !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tickets[0]?.ticket_game_status || '')}`}
                >
                  {tickets[0]?.ticket_game_status?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Gamepad2 className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Game</p>
                  <p className="text-gray-600">
                    {gameData?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Purchased Date</p>
                  <p className="text-gray-600">
                    {tickets[0]?.purchased_at
                      ? format(
                          new Date(tickets[0].purchased_at),
                          "EEEE, MMMM dd, yyyy",
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Total Amount</p>
                  <p className="text-gray-600 font-semibold">
                    {tickets.reduce((sum, ticket) => sum + (typeof ticket.total_price === 'string' ? parseFloat(ticket.total_price) : ticket.total_price), 0).toFixed(2)} ETB
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Ticket className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Quantity</p>
                  <p className="text-gray-600">
                    {tickets && tickets.length} Ticket{tickets && tickets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {gameData?.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Game Description
                </h3>
                <p className="text-gray-600">{gameData.description}</p>
              </div>
            )}

            {gameData?.rules && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Game Rules
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-700 text-sm">{gameData.rules}</p>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>
                Purchased on:{" "}
                {format(new Date(tickets[0]?.purchased_at || new Date()), "MMMM dd, yyyy HH:mm")}
              </p>
            </div>
          </CardBody>
        </Card>

        {tickets && tickets.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-900">Your Game Tickets</h2>
              <p className="text-sm text-gray-600 mt-1">
                Show these QR codes at the game entrance
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
                      Game Ticket #{index + 1}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {ticket.ticket_type?.name || gameData?.name || 'Game Ticket'}
                    </p>
                    <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-300">
                      <QRCodeSVG value={ticket.qr_token} size={200} />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 font-mono">
                      {ticket.ticket_code}
                    </p>
                    <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.ticket_game_status)}`}>
                      {getStatusIcon(ticket.ticket_game_status)}
                      <span>{ticket.ticket_game_status}</span>
                    </div>
                    {ticket.used_at && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        ✓ Used on{" "}
                        {format(
                          new Date(ticket.used_at),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </p>
                    )}
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Expires: {format(new Date(ticket.expires_at), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
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
          <Button variant="secondary" onClick={() => router.push("/buy")}>
            Buy More Tickets
          </Button>
        </div>
      </div>
    </div>
  );
}
