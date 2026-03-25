"use client";

import { useState, useEffect, use } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { guestCookieUtils } from "@/utils/cookies";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import {
  Ticket as TicketIcon,
  QrCode,
  X,
  Download,
  Share2,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
} from "lucide-react";

// ── HELPER FUNCTIONS ─────────────────────────────────────────────────────────────

const getDynamicPassName = (items: any[]) => {
  if (!items || items.length === 0) return "Custom Pass";
  const uniqueGames = [...new Set(items.map((i) => i.productName))];
  if (uniqueGames.length === 1) return uniqueGames[0];
  if (uniqueGames.length === 2) return `${uniqueGames[0]} & ${uniqueGames[1]}`;
  return `${uniqueGames[0]} & ${uniqueGames[1]}...`;
};

const isUserMode = (booking: any) => {
  return (
    booking.userId &&
    booking.passes &&
    (booking.passes.events?.length > 0 || booking.passes.games?.length > 0)
  );
};

const convertGuestDataToTicketProduct = (booking: any) => {
  if (isUserMode(booking)) {
    return booking.ticket?.passes || [];
  }

  const guestGames =
    booking.passes?.games?.map((game: any) => ({
      id: game.gameName || "unknown",
      productName: game.gameName || "Game Pass",
      productType: "GAME" as const,
      usageDetails:
        game.ticketTypes?.map((tt: any) => ({
          category: tt.category || "ADULT",
          totalQuantity: tt.quantity,
          usedQuantity: 0,
          status: "AVAILABLE" as const,
          lastUsedAt: new Date().toISOString(),
        })) || [],
    })) || [];

  return guestGames;
};

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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className={`${isDarkTheme ? "bg-gray-900 border border-white/10" : "bg-white"} rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`${isDarkTheme ? "bg-black/40 text-white" : "bg-gray-100 text-gray-900"} p-8 text-center relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20"
            >
              <X size={20} />
            </button>
            <h2 className="font-black text-2xl uppercase tracking-tighter italic">{guestName}</h2>
            <p className="font-mono text-xs uppercase tracking-widest mt-1 opacity-60">REF: {refId}</p>
          </div>

          <div className={`p-10 flex flex-col items-center ${isDarkTheme ? "bg-[#111]" : "bg-gray-50"}`}>
            <div className={`${isDarkTheme ? "bg-white p-4" : "bg-white border-8 border-slate-100"} rounded-[32px] mb-8`}>
              {qrValue ? (
                <QRCodeSVG
                  value={`${window.location.origin}/scan/${qrValue}`}
                  size={200}
                  bgColor="transparent"
                  fgColor="black"
                />
              ) : (
                <div className="text-center p-4 text-red-500 font-black uppercase text-xs">QR Unavailable</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-accent text-white"
              >
                <Download size={16} /> Print
              </button>
              <button className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${isDarkTheme ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900"}`}>
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
    (acc: any, i: any) => ({
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
      className={`group relative h-[420px] w-full rounded-[40px] overflow-hidden border shadow-sm transition-all ${
        isFullyUsed ? "grayscale opacity-80" : "hover:shadow-2xl hover:scale-[1.02]"
      } ${isDarkTheme ? "border-gray-800" : "border-slate-100"}`}
    >
      <img
        src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop"
        alt={item.productName}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10">
        <h3 className="font-black text-3xl text-white tracking-tighter drop-shadow-lg leading-tight uppercase italic max-w-[60%]">
          {item.productName}
        </h3>
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-[24px] border border-white/20 text-white shadow-xl text-right">
          <span className="text-[9px] font-black opacity-60 uppercase block mb-1 tracking-tighter">Remaining</span>
          <span className="font-black text-4xl tracking-tighter leading-none italic">
            {totalQuantity - usedQuantity || "--"}
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 right-8 z-10">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/20 shadow-2xl">
          <div className="space-y-2 mb-4">
            {(item?.usageDetails || []).map((detail, idx) => (
              <div key={idx} className="flex justify-between items-center text-white text-[11px] font-black uppercase italic">
                <span className="opacity-80">{detail.category}</span>
                <span>{detail.totalQuantity - detail.usedQuantity} left</span>
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(usedQuantity / totalQuantity) * 100}%` }}
              className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── PAGE ───────────────────────────────────────────────────────────────────

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedPromise = use(params);
  const id = resolvedPromise.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDarkTheme } = useTheme();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadBookingDetails();
      } else {
        const guestBookings = guestCookieUtils.getGuestBookings();
        const found = guestBookings.find((b) => b.id === id);
        if (found) {
          setBooking(found);
          setLoading(false);
        } else {
          router.push("/my-bookings");
        }
      }
    }
  }, [user, authLoading, id]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookingById(id);
      setBooking(response.data || null);
    } catch (err) {
      console.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) return <div className="p-20 text-center font-black uppercase italic">Booking Not Found</div>;

  const event = isUserMode(booking) ? booking.passes?.events?.[0] || null : null;
  const ticketItems = convertGuestDataToTicketProduct(booking);

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"} pb-24 pt-10 px-4`}>
      <div className="max-w-6xl mx-auto">
        
        {/* PREMIUM HEADER - Unified QR and Title Section */}
        <header className="mb-14 flex flex-col gap-6">
          <button 
            onClick={() => router.back()} 
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-all mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}
          >
            <ArrowLeft size={14} /> Back to My Bookings
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
            {/* Access Pass Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsQRModalOpen(true)}
              className="relative group shrink-0"
            >
              <div className="absolute -inset-2 bg-accent rounded-[32px] blur opacity-20 group-hover:opacity-40 animate-pulse transition duration-1000"></div>
              <div className={`relative p-6 rounded-[32px] border flex flex-col items-center justify-center gap-1.5 min-w-[110px] ${isDarkTheme ? "bg-[#1a1a1a] border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
                <QrCode size={40} className={isDarkTheme ? "text-white" : "text-slate-900"} />
                <span className="text-[8px] font-black text-accent uppercase italic tracking-tighter">Digital Pass</span>
              </div>
            </motion.button>

            {/* Title & Reference Info */}
            <div className="text-center md:text-left">
              <h1 className={`text-4xl md:text-7xl font-black tracking-tighter leading-[0.85] uppercase italic mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {event?.name || getDynamicPassName(ticketItems)}
              </h1>
              <div className="flex flex-col gap-1">
                <p className={`text-xs font-black uppercase tracking-widest opacity-60 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  REF: <span className="text-accent">{booking.bookingReference}</span> • {user ? `${user.first_name} ${user.last_name}` : "Bora Admin"}
                </p>
                <p className={`text-xs font-black uppercase tracking-widest opacity-60 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  {booking.bookedAt ? format(new Date(booking.bookedAt), "EEEE, MMM dd") : format(new Date(), "EEEE, MMM dd")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* COLLECTOR GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {ticketItems.map((item: any, i: number) => (
            <CollectorTicketCard key={i} item={item} index={i} isDarkTheme={isDarkTheme} />
          ))}
        </div>

        {/* EXPERIENCE ITINERARY - Card View Improvements */}
        <div className="mt-16">
          <div className={`rounded-[50px] p-2 overflow-hidden ${isDarkTheme ? 'bg-white/5 border border-white/10' : 'bg-white shadow-2xl shadow-slate-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              
              {/* Date Feature Card */}
              <div className={`p-10 rounded-[42px] flex flex-col justify-between min-h-[220px] ${isDarkTheme ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-6">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Scheduled Visit</p>
                  <p className={`text-3xl font-black uppercase italic leading-none ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {event?.eventDate ? format(new Date(event.eventDate), "EEEE, MMM dd") : format(new Date(booking.bookedAt), "EEEE, MMM dd")}
                  </p>
                </div>
              </div>

              {/* Time Feature Card */}
              <div className={`p-10 rounded-[42px] flex flex-col justify-between min-h-[220px] ${isDarkTheme ? 'bg-accent text-white' : 'bg-slate-900 text-white'}`}>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-6">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Show Time / Access</p>
                  <p className="text-3xl font-black uppercase italic leading-none">
                    {event?.startTime && event?.endTime ? `${event.startTime} - ${event.endTime}` : "All Day Access"}
                  </p>
                </div>
              </div>

              {/* Location Feature Card */}
              <div className={`p-10 rounded-[42px] flex flex-col justify-between min-h-[220px] md:col-span-2 lg:col-span-1 ${isDarkTheme ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-6">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Venue Location</p>
                  <p className={`text-3xl font-black uppercase italic leading-none ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    Bora Amusement Park
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <QRModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        guestName={user ? `${user.first_name} ${user.last_name}` : "Guest User"}
        refId={booking.bookingReference}
        qrValue={booking.ticket?.qrToken || booking.qrToken}
        isDarkTheme={isDarkTheme}
      />
    </div>
  );
}