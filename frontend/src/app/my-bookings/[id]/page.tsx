"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { bookingService } from "@/services/bookingService";
import {
  Booking,
  GameBooking,
  Ticket,
  Ticket_Product,
  TicketType,
} from "@/types";
import { useAuth } from "../../../contexts/AuthContext";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import {
  Ticket as TicketIcon,
  Info,
  Sparkles,
  MapPin,
  QrCode,
  X,
  Download,
  Share2,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Link,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

// ── COMPONENTS ─────────────────────────────────────────────────────────────

const QRModal = ({
  isOpen,
  onClose,
  guestName,
  refId,
  qrValue,
  isDarkTheme,
}: {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
  refId: string;
  qrValue: string | undefined;
  isDarkTheme: boolean;
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
                <div>loadinc...</div>
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
    { totalQuantity: 0, usedQuantity: 0 }, // Initial object with two counters
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
          <>
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
          </>
        </div>
      </div>
    </motion.div>
  );
};

// ── PAGE ───────────────────────────────────────────────────────────────────

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedPromise = use(params);
  const id = resolvedPromise.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDarkTheme } = useTheme();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (user) loadBookingDetails();
  }, [user, authLoading, id]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookingById(id);
      setBooking(response.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div
        className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"} flex items-center justify-center`}
      >
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking)
    return (
      <div className="p-20 text-center font-black uppercase">
        Booking Not Found
      </div>
    );

  const games = booking.passes.games;
  const event = booking.passes.events?.[0];
  const ticket = booking.ticket;

  return (
    <div
      className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"} pb-24 pt-10 px-4`}
    >
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
              <Link
                href="/my-bookings"
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 hover:text-accent transition-colors ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
              >
                <ArrowLeft size={14} /> Back to List
              </Link>
              <div className="space-y-2">
                <h1
                  className={`text-5xl md:text-6xl font-black tracking-tighter leading-none italic uppercase ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                >
                  {event?.name}
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
                  {booking.bookingReference}
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
                  booking.status === "CONFIRMED"
                    ? `${isDarkTheme ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"}`
                    : `${isDarkTheme ? "bg-amber-900 text-amber-300" : "bg-amber-100 text-amber-700"}`
                }`}
              >
                {booking.status}
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
                {parseFloat(booking.totalAmount).toLocaleString()}{" "}
                <span className="text-xs">ETB</span>
              </p>
            </div>
          </div>
        </header>

        {/* COLLECTOR GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {ticket?.passes?.map((item, i) => (
              <CollectorTicketCard
                key={i}
                item={item}
                index={i}
                isDarkTheme={isDarkTheme}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* EXPERIENCE DETAILS & INFO */}
        {/* Event Itinerary - Only show for bookings with event data */}
        {event && (
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div
              className={`lg:col-span-2 rounded-[48px] p-10 shadow-sm ${isDarkTheme ? "bg-bg3 border-accent border" : "bg-white border border-slate-100"}`}
            >
              <h3
                className={`text-xs font-black uppercase tracking-[0.2em] mb-8 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
              >
                Event Itinerary
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDarkTheme ? "bg-indigo-900/20" : "bg-indigo-50"}`}
                  style={{ color: "var(--accent)" }}
                >
                  <Calendar size={24} />
                </div>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                  >
                    Schedule Date
                  </p>
                  <p
                    className={`text-lg font-black ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {event?.eventDate
                      ? format(new Date(event?.eventDate), "EEEE, MMM dd, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDarkTheme ? "bg-indigo-900/20" : "bg-indigo-50"}`}
                  style={{ color: "var(--accent)" }}
                >
                  <Clock size={24} />
                </div>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                  >
                    Show Time
                  </p>
                  <p
                    className={`text-lg font-black ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {event?.startTime} - {event?.endTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDarkTheme ? "bg-indigo-900/20" : "bg-indigo-50"}`}
                  style={{ color: "var(--accent)" }}
                >
                  <MapPin size={24} />
                </div>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                  >
                    Venue Location
                  </p>
                  <p
                    className={`text-lg font-black ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    Bora Amusement Park
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        guestName={`${user?.first_name} ${user?.last_name}`}
        refId={booking.bookingReference}
        qrValue={booking.ticket?.qr_token}
        isDarkTheme={isDarkTheme}
      />
    </div>
  );
}
