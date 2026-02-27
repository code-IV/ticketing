"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { gameService } from "@/services/gameService";
import { Game, TicketType, BookingItem } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Gamepad2, ShoppingCart, Plus, Minus, Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const resolvedparams = use(params);
  const gameId = resolvedparams.gameId;
  const router = useRouter();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "credit_card" | "debit_card" | "telebirr" | "cash"
  >("telebirr");

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    try {
      setLoading(true);
      const response = await gameService.getGameById(gameId);
      setGame(response.data?.game || null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load game");
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (ticketTypeId: string, quantity: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (quantity <= 0) {
        delete newCart[ticketTypeId];
      } else {
        newCart[ticketTypeId] = quantity;
      }
      return newCart;
    });
  };

  const getTotalAmount = () => {
    if (!game?.ticket_types) return 0;
    return Object.entries(cart).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = game.ticket_types?.find((t: TicketType) => t.id === ticketTypeId);
      return total + (ticketType ? ticketType.price * quantity : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handlePurchase = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (getTotalTickets() === 0) {
      setError("Please select at least one ticket");
      return;
    }

    setBooking(true);
    setError("");

    try {
      // For each ticket type, create a separate purchase
      const purchasePromises = Object.entries(cart).map(([ticketTypeId, quantity]) =>
        gameService.purchaseGameTickets(gameId, ticketTypeId, quantity)
      );

      const results = await Promise.all(purchasePromises);

      router.push(`/my-bookings`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Purchase failed. Please try again.",
      );
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Game Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The game you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/buy")}>Back to Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h1 className="text-3xl font-bold text-gray-900">
                  {game.name}
                </h1>
              </CardHeader>
              <CardBody className="space-y-6">
                <p className="text-gray-700 text-lg">
                  {game.description ||
                    "Experience this amazing game at Bora Park!"}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Gamepad2 className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Game Type</p>
                      <p className="text-gray-600">
                        {game.category || "Adventure Game"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Capacity</p>
                      <p className="text-gray-600">
                        {game.capacity || "Unlimited"} players
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600">
                        Bora Amusement Park, Addis Ababa
                      </p>
                    </div>
                  </div>
                </div>

                {game.rules && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Game Rules
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-700 text-sm">{game.rules}</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {game.ticket_types && game.ticket_types.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Select Tickets
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  {game.ticket_types.map((ticketType: TicketType) => (
                    <div
                      key={ticketType.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {ticketType.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ticketType.description}
                        </p>
                        <p className="text-lg font-bold text-purple-600 mt-1">
                          {ticketType.price} ETB
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateCart(
                              ticketType.id,
                              (cart[ticketType.id] || 0) - 1,
                            )
                          }
                          disabled={!cart[ticketType.id]}
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {cart[ticketType.id] || 0}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateCart(
                              ticketType.id,
                              (cart[ticketType.id] || 0) + 1,
                            )
                          }
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Purchase Summary
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {getTotalTickets() === 0 ? (
                  <p className="text-gray-600 text-center py-4">
                    No tickets selected
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {Object.entries(cart).map(([ticketTypeId, quantity]) => {
                        const ticketType = game.ticket_types?.find(
                          (t: TicketType) => t.id === ticketTypeId,
                        );
                        if (!ticketType) return null;
                        return (
                          <div
                            key={ticketTypeId}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {quantity}x {ticketType.name}
                            </span>
                            <span className="font-medium">
                              {(ticketType.price * quantity).toFixed(2)} ETB
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-purple-600">
                          {getTotalAmount().toFixed(2)} ETB
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {getTotalTickets()} ticket(s)
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as any)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="telebirr">Telebirr</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="cash">Cash (Pay at Park)</option>
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handlePurchase}
                  disabled={getTotalTickets() === 0 || booking}
                  isLoading={booking}
                >
                  {user ? "Complete Purchase" : "Login to Purchase"}
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
