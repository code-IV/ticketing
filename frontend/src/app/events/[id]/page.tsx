'use client';

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { eventService } from "@/services/eventService";
import { bookingService } from "@/services/bookingService";
import { Event, BookingItem } from "@/types";
import { motion } from 'framer-motion';
import { 
  Clock, MapPin, Calendar, ArrowLeft, 
  Ticket, Play, Share2, Plus, Minus, ShoppingCart, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { format } from "date-fns";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  // ── STATE ──
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "debit_card" | "telebirr" | "cash">("telebirr");

  // ── MOCK MEDIA ──
  const MOCK_VID = "https://player.vimeo.com/external/434045526.sd.mp4?s=c27ee37da9897116710497645167f536968d876d&profile_id=164&oauth2_token_id=57447761";
  const VIDEO_POSTER = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2000&auto=format&fit=crop";
  const MOCK_GALLERY = [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514525253361-bee8a19740c1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=600&auto=format&fit=crop"
  ];

  useEffect(() => { loadEvent(); }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(id);
      setEvent(response.data?.event || null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (ticketTypeId: string, quantity: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (quantity <= 0) delete newCart[ticketTypeId];
      else newCart[ticketTypeId] = quantity;
      return newCart;
    });
  };

  const getTotalAmount = () => {
    if (!event?.ticket_types) return 0;
    return Object.entries(cart).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = event.ticket_types?.find((t) => t.id === ticketTypeId);
      return total + (ticketType ? ticketType.price * quantity : 0);
    }, 0);
  };

  const getTotalTickets = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleBooking = async () => {
    if (!user) { router.push("/login"); return; }
    if (getTotalTickets() === 0) { setError("Please select at least one ticket"); return; }
    setBooking(true);
    setError("");
    try {
      const items: BookingItem[] = Object.entries(cart).map(([ticketTypeId, quantity]) => ({
        ticketTypeId, quantity,
      }));
      const response = await bookingService.createBooking({
        eventId: id,
        items,
        paymentMethod,
      });
      router.push(`/bookings/${response.data?.booking.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Booking failed.");
    } finally {
      setBooking(false);
    }
  };

  // ── SHARED COMPONENT: ORDER SUMMARY ──
  const OrderSummaryUI = () => (
    <div className="space-y-6">
      {getTotalTickets() === 0 ? (
        <p className="text-slate-300 font-medium italic py-4">Select your passes to review your order...</p>
      ) : (
        <>
          {Object.entries(cart).map(([tid, qty]) => {
            const t = event?.ticket_types?.find(x => x.id === tid);
            return (
              <div key={tid} className="flex justify-between items-center pb-4 border-b border-slate-50">
                <div>
                  <p className="font-black text-slate-900 uppercase text-sm">{t?.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{qty} Tickets</p>
                </div>
                <p className="font-black text-slate-900">{(t?.price || 0) * qty} ETB</p>
              </div>
            );
          })}
          <div className="flex justify-between items-center pt-6">
            <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Grand Total</p>
            <div className="text-right">
              <p className="text-4xl lg:text-5xl font-black text-indigo-600 tracking-tighter">{getTotalAmount()}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Birr</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!event) return <div className="p-20 text-center font-black uppercase tracking-widest">Event not found.</div>;

  const isSoldOut = (event.capacity - event.tickets_sold) <= 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* ── HEADER ── */}
        <header className="mb-8 flex items-center justify-between">
          <Link href="/events" className="group flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Back to Lineup</span>
          </Link>
          <button className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm hover:scale-110 transition-transform">
            <Share2 size={18} />
          </button>
        </header>

        <div className="flex flex-col gap-8">
          
          {/* ── MEDIA SECTION (2/3 Video, 1/3 Gallery) ── */}
          <section className="relative w-full rounded-[48px] overflow-hidden border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col h-[650px] md:h-[800px]">
              <div className="relative h-2/3 w-full bg-slate-900 overflow-hidden">
                <video 
                  src={event.video_url || MOCK_VID} 
                  poster={VIDEO_POSTER}
                  autoPlay muted loop playsInline 
                  className="w-full h-full object-cover opacity-70 scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                <div className="absolute top-8 left-8">
                  <span className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                    <Play size={12} fill="currentColor" /> Event Trailer
                  </span>
                </div>
              </div>
              <div className="relative h-1/3 w-full p-4 md:p-6 bg-white flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                {MOCK_GALLERY.map((img, idx) => (
                  <motion.div key={idx} whileHover={{ scale: 1.02, y: -5 }} className="flex-shrink-0 w-64 md:w-80 h-full rounded-[28px] overflow-hidden border border-slate-100 shadow-sm">
                    <img src={img} alt={`gallery-${idx}`} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CONTENT & BOOKING GRID ── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
            
            {/* ── LEFT COLUMN: INFO ── */}
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-8 uppercase">
                  {event.name.split(' ')[0]} <br /> 
                  <span className="text-indigo-600">{event.name.split(' ').slice(1).join(' ')}</span>
                </h1>
                
                <p className="text-slate-500 text-xl font-medium leading-relaxed mb-10 max-w-2xl">
                  {event.description || "Experience a world-class production at Bora Park. Featuring state-of-the-art visuals and performances that redefine entertainment."}
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
                  <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                    <Calendar className="text-indigo-600 mb-2" size={20} />
                    <p className="text-[9px] font-black text-slate-400 uppercase">Date</p>
                    <p className="text-lg font-black text-slate-900">{format(new Date(event.event_date), "MMM dd, yyyy")}</p>
                  </div>
                  <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                    <Clock className="text-indigo-600 mb-2" size={20} />
                    <p className="text-[9px] font-black text-slate-400 uppercase">Time</p>
                    <p className="text-lg font-black text-slate-900">{event.start_time}</p>
                  </div>
                  <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                    <MapPin className="text-indigo-600 mb-2" size={20} />
                    <p className="text-[9px] font-black text-slate-400 uppercase">Venue</p>
                    <p className="text-lg font-black text-slate-900">Bora Stage</p>
                  </div>
                </div>

                {/* ── FINAL ORDER REVIEW (Desktop Only) ── */}
                <div className="hidden lg:block p-8 md:p-12 rounded-[48px] bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                    <ShoppingCart size={16} /> Final Order Review
                  </h3>
                  <OrderSummaryUI />
                </div>
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN: PASS SELECTION & CHECKOUT ── */}
            <aside className="lg:col-span-5">
              <div className="sticky top-10 flex flex-col gap-6">
                
                {/* 1. SELECT YOUR PASSES */}
                <div className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Select Your Passes</h3>
                  <div className="space-y-4">
                    {event.ticket_types?.map((type) => (
                      <div key={type.id} className="p-5 rounded-[28px] bg-[#F8FAFC] border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-all">
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{type.name}</p>
                          <p className="text-xl font-black text-slate-900">{type.price} <span className="text-[10px] opacity-40">ETB</span></p>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm">
                          <button onClick={() => updateCart(type.id, (cart[type.id] || 0) - 1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Minus size={14}/></button>
                          <span className="font-black text-sm w-4 text-center">{cart[type.id] || 0}</span>
                          <button onClick={() => updateCart(type.id, (cart[type.id] || 0) + 1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-900 hover:bg-indigo-600 hover:text-white transition-colors"><Plus size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── FINAL ORDER REVIEW (Mobile Only: Appears under selector) ── */}
                <div className="lg:hidden p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                    <ShoppingCart size={16} /> Your Selection
                  </h3>
                  <OrderSummaryUI />
                </div>

                {/* 2. CHECKOUT CARD */}
                <div className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl">
                  <div className="mb-6">
                    <label className="block text-[8px] font-black uppercase text-indigo-400 mb-2 tracking-widest">Payment Method</label>
                    <select 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="telebirr" className="bg-slate-900">Telebirr SuperApp</option>
                      <option value="credit_card" className="bg-slate-900">Credit Card</option>
                      <option value="cash" className="bg-slate-900">Pay at Gate</option>
                    </select>
                  </div>

                  {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-2xl mb-6">{error}</div>}

                  <button 
                    onClick={handleBooking}
                    disabled={getTotalTickets() === 0 || booking || isSoldOut}
                    className="group w-full py-6 rounded-[24px] bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {booking ? "Processing..." : user ? "Confirm Order" : "Login to Book"} 
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}