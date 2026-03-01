"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { Booking, Ticket } from "@/types";
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
  Link
} from "lucide-react";

// ── COMPONENTS ─────────────────────────────────────────────────────────────

const QRModal = ({ isOpen, onClose, guestName, refId, qrValue }) => (
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
          className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-900 p-8 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white/50 hover:text-white">
              <X size={20} />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Master Pass
            </div>
            <h2 className="text-white font-black text-2xl uppercase tracking-tighter">{guestName}</h2>
            <p className="text-indigo-300/60 font-mono text-xs uppercase tracking-widest mt-1">REF: {refId}</p>
          </div>

          <div className="p-10 flex flex-col items-center">
            <div className="bg-white p-6 rounded-[32px] border-4 border-slate-100 mb-8 relative group">
               <QRCodeSVG value={qrValue} size={180} />
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => window.print()} className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                <Download size={16} /> Print
              </button>
              <button className="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CollectorTicketCard = ({ item, index }) => {
  const isFullyUsed = item.used >= item.purchased;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative h-[380px] w-full rounded-[40px] overflow-hidden border border-slate-100 shadow-sm transition-all ${
        isFullyUsed ? "grayscale opacity-80" : "hover:shadow-2xl hover:scale-[1.02]"
      }`}
    >
      <img 
        src={item.image || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop"} 
        alt={item.name} 
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10">
        <div className="max-w-[60%]">
          <h3 className="font-black text-3xl text-white tracking-tighter drop-shadow-lg leading-tight uppercase italic">{item.name}</h3>
          <p className="flex items-center gap-1.5 text-white/70 text-[10px] font-black uppercase mt-2 tracking-widest">
            <Sparkles size={12} className="text-indigo-400" /> Premium Access
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-[24px] border border-white/20 text-right text-white shadow-xl">
          <span className="text-[9px] font-black opacity-60 uppercase block mb-1 tracking-tighter">Remaining</span>
          <span className="font-black text-4xl tracking-tighter leading-none italic">{item.purchased - item.used}</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 right-8 z-10">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/20 shadow-2xl">
          <div className="flex justify-between items-center text-white text-[11px] font-black uppercase mb-4 tracking-widest">
            <span className="opacity-80">Utilization</span>
            <span className="flex items-center gap-2 bg-indigo-600 px-3 py-1 rounded-full text-[9px]"><TicketIcon size={12}/> {item.used}/{item.purchased}</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${(item.used / item.purchased) * 100}%` }} 
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

  const [booking, setBooking] = useState<Booking | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) loadBookingDetails();
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) return <div className="p-20 text-center font-black uppercase">Booking Not Found</div>;

  // Logic to group tickets by type for the Collector Cards
  const ticketGroups = booking.items?.map(item => {
    const typeTickets = tickets.filter(t => t.ticket_type_id === item.ticket_type_id);
    return {
      id: item.id,
      name: item.ticket_type_name,
      purchased: item.quantity,
      used: typeTickets.filter(t => t.is_used).length,
      image: booking.event_image || undefined
    };
  }) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-10 px-4">
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
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[32px] blur opacity-20 group-hover:opacity-40 animate-pulse transition duration-1000"></div>
              <div className="relative bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 min-w-[100px]">
                <QrCode size={36} className="text-slate-900" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Access Pass</span>
              </div>
            </motion.button>

            <div className="text-center md:text-left">
               <Link href="/my-bookings" className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={14} /> Back to List
              </Link>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                {booking.event_name}
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                Pass for <span className="text-slate-900 font-bold uppercase">{user?.first_name} {user?.last_name}</span> · REF: <span className="font-mono text-indigo-600 font-bold">{booking.booking_reference}</span>
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {booking.booking_status}
              </span>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
              <p className="text-xl font-black text-slate-900 tracking-tighter">{parseFloat(booking.total_amount).toLocaleString()} <span className="text-xs">ETB</span></p>
            </div>
          </div>
        </header>

        {/* COLLECTOR GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {ticketGroups.map((item, i) => (
              <CollectorTicketCard key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* EXPERIENCE DETAILS & INFO */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Event Itinerary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Calendar size={24}/></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Schedule Date</p>
                            <p className="text-lg font-black text-slate-900">{format(new Date(booking.event_date), "EEEE, MMM dd, yyyy")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Clock size={24}/></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Show Time</p>
                            <p className="text-lg font-black text-slate-900">{booking.start_time} - {booking.end_time}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><MapPin size={24}/></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Venue Location</p>
                            <p className="text-lg font-black text-slate-900">Bora Amusement Park</p>
                        </div>
                    </div>
                </div>
            </div>

            
        </div>
      </div>

      <QRModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        guestName={`${user?.first_name} ${user?.last_name}`}
        refId={booking.booking_reference}
        qrValue={tickets[0]?.qr_token || booking.booking_reference}
      />
    </div>
  );
}