"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { gameService } from "@/services/gameService";
import { Game, TicketType, BookingItem, Ticket_Product } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Gamepad2, ShoppingCart, Plus, Minus, Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle, Ticket as TicketIcon, QrCode, X, Download, Share2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import SuccessModal from "@/components/ui/SuccessModal";

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const resolvedparams = use(params);
  const gameId = resolvedparams.gameId;
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkTheme } = useTheme();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "credit_card" | "debit_card" | "telebirr" | "cash"
  >("telebirr");
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string>("");

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
      // Purchase each selected ticket type
      const purchasePromises = Object.entries(cart).map(([ticketTypeId, quantity]) =>
        gameService.purchaseGameTickets(gameId, ticketTypeId, quantity)
      );

      const results = await Promise.all(purchasePromises);

      // Extract the first booking ID (all purchases should be part of the same booking)
      const firstBookingId = results[0]?.data?.booking?.bookingId;
      if (firstBookingId) {
        // Set purchase complete state and booking data
        setPurchaseComplete(true);
        setBookingData(results[0]?.data?.booking);
        setCurrentBookingId(firstBookingId);
        setShowSuccessModal(true);
        // Redirect to the booking details page
        router.push(`/my-bookings/${firstBookingId}`);
      } else {
        // Fallback to the bookings list if no ID is returned
        router.push("/my-bookings");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Purchase failed. Please try again."
      );
    } finally {
      setBooking(false);
    }
  };

  // QR Modal Component
  const QRModal = ({
    isOpen,
    onClose,
    guestName,
    refId,
    qrValue,
  }: {
    isOpen: boolean;
    onClose: () => void;
    guestName: string;
    refId: string;
    qrValue: string | undefined;
  }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className={`${isDarkTheme ? "bg-gray-800" : "bg-white"} rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`${isDarkTheme ? "bg-bg1 text-white" : "bg-gray-100 text-gray-900"} p-8 text-center relative`}
            >
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-full ${isDarkTheme ? "bg-white/10 text-white/50 hover:text-white" : "bg-black/10 text-black/50 hover:text-black"}`}
              >
                <X size={20} />
              </button>
              <h2
                className={`${isDarkTheme ? "text-white" : "text-gray-900"} font-black text-2xl uppercase tracking-tighter`}
              >
                {guestName}
              </h2>
              <p
                className={`${isDarkTheme ? "text-indigo-300/60" : "text-indigo-600/60"} font-mono text-xs uppercase tracking-widest mt-1`}
              >
                REF: {refId}
              </p>
            </div>

            <div
              className={`p-10 flex flex-col items-center ${isDarkTheme ? "bg-bg3" : "bg-gray-50"}`}
            >
              <div
                className={`${isDarkTheme ? "bg-bg3 border-gray-600" : "bg-white border-slate-100"} p-6 rounded-[32px] border-4 mb-8 relative group`}
              >
                {qrValue ? (
                  <QRCodeSVG
                    value={`${window.location.origin}/scan/${qrValue}`}
                    size={180}
                    bgColor="transparent"
                    fgColor={isDarkTheme ? "white" : "black"}
                  />
                ) : (
                  <div>Loading...</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => window.print()}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${isDarkTheme ? "bg-gray-800 text-white" : "bg-slate-900 text-white"}`}
                >
                  <Download size={16} /> Print
                </button>
                <button
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${isDarkTheme ? "bg-gray-700 text-white" : "bg-slate-100 text-slate-900"}`}
                >
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Ticket Card Component
  const CollectorTicketCard = ({
    item,
    index,
    isDarkTheme,
  }: {
    item: Ticket_Product;
    index: number;
    isDarkTheme: boolean;
  }) => {
    const { totalQuantity, usedQuantity } = (item?.usageDetails || []).reduce(
      (acc, i) => ({
        totalQuantity: acc.totalQuantity + i.totalQuantity,
        usedQuantity: acc.usedQuantity + i.usedQuantity,
      }),
      { totalQuantity: 0, usedQuantity: 0 },
    );
    const isFullyUsed = usedQuantity >= totalQuantity;
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`group relative h-[380px] w-full rounded-[40px] overflow-hidden border border-accent shadow-sm transition-all ${
          isFullyUsed
            ? "grayscale opacity-80"
            : "hover:shadow-2xl hover:scale-[1.02]"
        } ${isDarkTheme ? "border-gray-700" : "border-slate-100"}`}
      >
        <img
          src={
            "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop"
          }
          alt={item.productName}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10">
          <div className="max-w-[60%]">
            <h3 className="font-black text-3xl text-white tracking-tighter drop-shadow-lg leading-tight uppercase italic">
              {item.productName}
            </h3>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-[24px] border border-white/20 text-right text-white shadow-xl">
            <span className="text-[9px] font-black opacity-60 uppercase block mb-1 tracking-tighter">
              Remaining
            </span>
            <span className="font-black text-4xl tracking-tighter leading-none italic">
              {totalQuantity - usedQuantity || "--"}
            </span>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 z-10">
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center text-white text-[11px] font-black uppercase mb-4 tracking-widest">
              <span className="opacity-80">Utilization</span>
              <span className="flex items-center gap-2 bg-accent px-3 py-1 rounded-full text-[9px]">
                <TicketIcon size={12} /> {usedQuantity}/{totalQuantity}
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(usedQuantity / totalQuantity) * 100}%`,
                }}
                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            Game Not Found
          </h2>
          <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            The game you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/buy")}>Back to Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'} pb-24 pt-10 px-4`}>
      <div className="max-w-6xl mx-auto">
        {/* PREMIUM HEADER */}
        <header className="mb-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsQRModalOpen(true)}
              className="relative group shrink-0"
            >
              <div className="absolute -inset-2 bg-gradient-to-tr from-accent to-purple-600 rounded-[32px] blur opacity-20 group-hover:opacity-40 animate-pulse transition duration-1000"></div>
              <div
                className={`relative bg-bg1 p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 min-w-[100px] ${isDarkTheme ? "bg-[#1a1a1a] border-gray-700 text-white" : "bg-white border-slate-100 text-slate-900"}`}
              >
                <QrCode
                  size={36}
                  className={`${isDarkTheme ? "text-white" : "text-slate-900"}`}
                />
                <span className="text-[9px] font-black text-accent uppercase tracking-tighter">
                  Access Pass
                </span>
              </div>
            </motion.button>

            <div className="text-center md:text-left">
              <button
                onClick={() => router.push("/buy")}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 hover:text-accent transition-colors ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
              >
                <ArrowLeft size={14} /> Back to Games
              </button>
              <div className="space-y-2">
                <h1
                  className={`text-5xl md:text-6xl font-black tracking-tighter leading-none italic uppercase ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  {game.name}
                </h1>
              </div>
              <p
                className={`mt-2 text-sm font-medium ${isDarkTheme ? "text-gray-500" : "text-slate-500"}`}
              >
                Pass for{" "}
                <span className="text-accent font-bold uppercase">
                  {user?.first_name} {user?.last_name}
                </span>{" "}
                · REF:{" "}
                <span className="font-mono text-accent font-bold">
                  {bookingData?.bookingReference || "GAME-PURCHASE"}
                </span>
              </p>
            </div>
          </div>

          <div
            className={`hidden sm:flex items-center gap-6 p-6 rounded-[40px] shadow-sm ${isDarkTheme ? "bg-bg3 border-gray-700" : "bg-white border-slate-100"}`}
          >
            <div className="text-right">
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
              >
                Status
              </p>
              <span
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  purchaseComplete
                    ? `${isDarkTheme ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"}`
                    : `${isDarkTheme ? "bg-amber-900 text-amber-300" : "bg-amber-100 text-amber-700"}`
                }`}
              >
                {purchaseComplete ? "CONFIRMED" : "PENDING"}
              </span>
            </div>
            <div
              className={`w-px h-10 ${isDarkTheme ? "bg-gray-700" : "bg-slate-100"}`}
            />
            <div className="text-right">
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
              >
                Amount
              </p>
              <p
                className={`text-xl font-black tracking-tighter ${isDarkTheme ? "text-white" : "text-slate-900"}`}
              >
                {getTotalAmount().toFixed(2)}{" "}
                <span className="text-xs">ETB</span>
              </p>
            </div>
          </div>
        </header>

        {/* COLLECTOR GRID - Show after purchase */}
        {purchaseComplete && bookingData?.ticket?.passes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {bookingData.ticket.passes.map((item: Ticket_Product, i: number) => (
                <CollectorTicketCard
                  key={i}
                  item={item}
                  index={i}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* PURCHASE FORM - Show before purchase */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {game.name}
                  </h1>
                </CardHeader>
                <CardBody className="space-y-6">
                  <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} text-lg`}>
                    {game.description ||
                      "Experience this amazing game at Bora Park!"}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Gamepad2 className="h-5 w-5 text-accent mt-1" />
                      <div>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Game Type</p>
                        <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {game.category || "Adventure Game"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-accent mt-1" />
                      <div>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Capacity</p>
                        <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {game.capacity || "Unlimited"} players
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-accent mt-1" />
                      <div>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Location</p>
                        <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          Bora Amusement Park, Addis Ababa
                        </p>
                      </div>
                    </div>
                  </div>

                  {game.rules && (
                    <div>
                      <h3 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                        Game Rules
                      </h3>
                      <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                        <p className="text-sm">{game.rules}</p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {game.ticket_types && game.ticket_types.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      Select Tickets
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {game.ticket_types.map((ticketType: TicketType) => (
                      <div
                        key={ticketType.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                            {ticketType.name}
                          </h3>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {ticketType.description}
                          </p>
                          <p className="text-lg font-bold text-accent mt-1">
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
                  <h2 className={`text-xl font-bold flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Purchase Summary
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  {getTotalTickets() === 0 ? (
                    <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
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
                              <span className={isDarkTheme ? 'text-gray-300' : 'text-gray-700'}>
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
                          <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>Total</span>
                          <span className="text-accent">
                            {getTotalAmount().toFixed(2)} ETB
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {getTotalTickets()} ticket(s)
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as any)
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkTheme ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                    >
                      <option value="telebirr">Telebirr</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="cash">Cash (Pay at Park)</option>
                    </select>
                  </div>

                  {error && (
                    <div className={`border px-3 py-2 rounded-lg text-sm ${isDarkTheme ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
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
        )}
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        guestName={`${user?.first_name} ${user?.last_name}`}
        refId={bookingData?.bookingReference || "GAME-PURCHASE"}
        qrValue={bookingData?.ticket?.qr_token}
      />
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Game Tickets Purchased!"
        message="Your game passes have been confirmed. Get ready for an amazing adventure at Bora Park!"
        bookingReference={bookingData?.bookingReference}
        bookingId={currentBookingId}
        showActions={true}
      />
    </div>
  );
}