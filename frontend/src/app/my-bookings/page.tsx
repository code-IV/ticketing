'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { Booking, GameTicket } from '@/types';
import ticketService from '@/services/ticketService';
import { Calendar, Clock, CreditCard, Eye, XCircle, Gamepad2, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const palettes = [
  ['#E8431A', '#FAF0DC', '#FAF0DC'],
  ['#FAF0DC', '#1A1A2E', '#E8431A'],
  ['#1A1A2E', '#F5C842', '#E8431A'],
  ['#F5C842', '#1A1A2E', '#E8431A'],
  ['#2D6A4F', '#FAF0DC', '#F5C842'],
  ['#7B2D8B', '#FAF0DC', '#F5C842'],
  ['#E8431A', '#1A1A2E', '#F5C842'],
  ['#1A1A2E', '#FAF0DC', '#F5C842'],
  ['#F5C842', '#E8431A', '#1A1A2E'],
];

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [gameTickets, setGameTickets] = useState<GameTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    else if (user) loadBookings();
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const [bookingsResponse, ticketsResponse] = await Promise.all([
        bookingService.getMyBookings(1, 50),
        ticketService.getMyTickets(1, 50),
      ]);
      setBookings(bookingsResponse.data.bookings || []);
      setGameTickets(ticketsResponse.data.tickets || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings and tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await bookingService.cancelBooking(bookingId);
      await loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const getAllItems = () => {
    const items = [
      ...bookings.map(b => ({ ...b, itemType: 'BOOKING' as const })),
      ...gameTickets.map(t => ({ ...t, itemType: 'GAME_TICKET' as const })),
    ];
    return items.sort((a, b) => {
      const dateA = new Date(a.itemType === 'BOOKING' ? (a as any).booked_at : (a as any).purchased_at);
      const dateB = new Date(b.itemType === 'BOOKING' ? (b as any).booked_at : (b as any).purchased_at);
      return dateB.getTime() - dateA.getTime();
    });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF0DC' }}>
        <motion.p
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-[#E8431A] font-black text-2xl uppercase tracking-widest"
          style={{ fontFamily: "'Arial Black', sans-serif" }}
        >
          LOADING…
        </motion.p>
      </div>
    );
  }

  const allItems = getAllItems();

  return (
    <div className="min-h-screen" style={{ background: '#FAF0DC' }}>

      {/* ── RETRO HEADER ── */}
      <div className="relative overflow-hidden pt-20 pb-4" style={{ background: '#1A1A2E' }}>
        {/* Concentric arcs */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          {[520, 420, 320, 220].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: size, height: size,
                borderColor: i % 2 === 0 ? 'rgba(245,200,66,0.12)' : 'rgba(232,67,26,0.12)',
                top: '50%', left: '50%',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 text-center pb-10 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[#F5C842] text-[10px] font-black uppercase tracking-[0.6em] mb-4">
              ✦ Bora Park ✦
            </p>
            <h1
              className="font-black uppercase leading-none text-[#FAF0DC]"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 7rem)', letterSpacing: '-0.02em' }}
            >
              MY
            </h1>
            <div className="flex items-center justify-center gap-4 my-1">
              <div className="h-0.5 flex-1 max-w-32" style={{ background: '#E8431A' }} />
              <p className="text-[#E8431A] font-black text-sm uppercase tracking-[0.4em]">
                {format(new Date(), 'yyyy')}
              </p>
              <div className="h-0.5 flex-1 max-w-32" style={{ background: '#E8431A' }} />
            </div>
            <h1
              className="font-black uppercase leading-none"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 7rem)', letterSpacing: '-0.02em', color: '#F5C842' }}
            >
              BOOKINGS
            </h1>
          </motion.div>
        </div>

        {/* Zigzag border */}
        <svg viewBox="0 0 1200 30" className="w-full" preserveAspectRatio="none" style={{ display: 'block' }}>
          <polyline
            points={Array.from({ length: 61 }, (_, i) => `${i * 20},${i % 2 === 0 ? 30 : 0}`).join(' ')}
            fill="none" stroke="#FAF0DC" strokeWidth="2"
          />
          <polygon
            points={`0,30 ${Array.from({ length: 61 }, (_, i) => `${i * 20},${i % 2 === 0 ? 30 : 0}`).join(' ')} 1200,30`}
            fill="#FAF0DC"
          />
        </svg>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 pb-28">

        {error && (
          <p className="text-[#E8431A] text-sm mb-8 p-4 border-2 border-[#E8431A] font-sans">{error}</p>
        )}

        {/* ── Empty state ── */}
        {allItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 border-4 border-dashed border-[#1A1A2E]/20"
          >
            <p className="text-6xl mb-6">🎟️</p>
            <h3
              className="text-3xl font-black uppercase text-[#1A1A2E] mb-3"
              style={{ fontFamily: "'Arial Black', sans-serif" }}
            >
              NO TICKETS YET
            </h3>
            <p className="text-[#1A1A2E]/50 font-sans text-sm mb-8">
              You haven't booked any events or purchased game tickets. Start exploring!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => router.push('/events')}
                className="font-black uppercase text-xs tracking-widest px-8 py-4 transition-all"
                style={{ background: '#E8431A', color: '#FAF0DC', border: '3px solid #1A1A2E', fontFamily: "'Arial Black', sans-serif" }}
              >
                BROWSE EVENTS →
              </button>
              <button
                onClick={() => router.push('/buy')}
                className="font-black uppercase text-xs tracking-widest px-8 py-4 transition-all"
                style={{ background: '#FAF0DC', color: '#1A1A2E', border: '3px solid #1A1A2E', fontFamily: "'Arial Black', sans-serif" }}
              >
                BUY GAME TICKETS →
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {allItems.map((item, i) => {
                const [bg, text, accent] = palettes[i % palettes.length];
                const isGameTicket = item.itemType === 'GAME_TICKET';
                const name = isGameTicket ? (item as any).game_name : (item as any).event_name;
                const status = isGameTicket ? (item as any).status : (item as any).booking_status;
                const price = isGameTicket
                  ? parseFloat((item as any).total_price).toFixed(2)
                  : parseFloat((item as any).total_amount).toFixed(2);
                const date = isGameTicket ? (item as any).purchased_at : (item as any).booked_at;
                const canCancel = !isGameTicket && (item as any).booking_status === 'confirmed';

                return (
                  <motion.div
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, rotate: -1, scale: 0.97 },
                      visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.5 } },
                    }}
                    whileHover={{ scale: 1.02, rotate: i % 2 === 0 ? 0.6 : -0.6, transition: { duration: 0.2 } }}
                  >
                    <div
                      className="relative overflow-hidden cursor-pointer"
                      style={{ background: bg, border: `3px solid ${text}` }}
                    >
                      {/* Top bar */}
                      <div
                        className="px-4 py-2 flex items-center justify-between"
                        style={{ background: text, color: accent }}
                      >
                        <div className="flex items-center gap-2">
                          {isGameTicket
                            ? <Gamepad2 className="w-3.5 h-3.5" />
                            : <Calendar className="w-3.5 h-3.5" />
                          }
                          <span className="font-black text-[10px] uppercase tracking-[0.4em]">
                            {isGameTicket ? 'GAME TICKET' : 'EVENT BOOKING'}
                          </span>
                        </div>
                        <span
                          className="font-black text-[10px] uppercase tracking-[0.3em] px-2 py-0.5"
                          style={{ background: accent, color: text === '#FAF0DC' ? '#1A1A2E' : bg }}
                        >
                          {status?.toUpperCase()}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        {/* Giant date number */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p
                              className="font-black leading-none"
                              style={{
                                fontFamily: "'Arial Black', sans-serif",
                                fontSize: 'clamp(2.5rem, 7vw, 4rem)',
                                color: accent,
                                lineHeight: 0.85,
                              }}
                            >
                              {format(new Date(date), 'd')}
                            </p>
                            <p
                              className="font-black uppercase tracking-wider text-sm"
                              style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif' }}
                            >
                              {format(new Date(date), 'MMM yyyy')}
                            </p>
                          </div>
                          {/* Price circle */}
                          <div
                            className="w-16 h-16 rounded-full border-4 flex items-center justify-center shrink-0"
                            style={{ borderColor: accent }}
                          >
                            <span className="font-black text-[9px] text-center leading-tight" style={{ color: accent, fontFamily: 'sans-serif' }}>
                              {price}<br />ETB
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="my-3 border-t-2" style={{ borderColor: `${text}20` }} />

                        {/* Name */}
                        <h3
                          className="font-black uppercase leading-tight mb-3"
                          style={{
                            fontFamily: "'Arial Black', sans-serif",
                            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                            color: text,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {name}
                        </h3>

                        {/* Details */}
                        <div className="space-y-1.5 mb-5">
                          {isGameTicket ? (
                            <>
                              <div className="flex items-center gap-2 text-xs" style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif' }}>
                                <Ticket className="w-3.5 h-3.5 shrink-0" />
                                {(item as any).quantity} Ticket{(item as any).quantity !== 1 ? 's' : ''}
                              </div>
                              <div className="flex items-center gap-2 text-xs" style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif' }}>
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {format(new Date(date), 'HH:mm')}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 text-xs" style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif' }}>
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {(item as any).event_date ? format(new Date((item as any).event_date), 'MMM dd, yyyy') : 'N/A'}
                              </div>
                              <div className="flex items-center gap-2 text-xs" style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif' }}>
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {(item as any).start_time} – {(item as any).end_time}
                              </div>
                              <div className="flex items-center gap-2 text-xs" style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif' }}>
                                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                                Ref: {(item as any).booking_reference}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => isGameTicket
                              ? router.push(`/tickets/${(item as any).game_id}`)
                              : router.push(`/bookings/${item.id}`)
                            }
                            className="flex-1 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest py-2.5 transition-all"
                            style={{ background: accent, color: text === '#FAF0DC' ? '#1A1A2E' : bg, border: `2px solid ${accent}` }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            VIEW DETAILS
                          </button>

                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking((item as any).id)}
                              disabled={cancelling === (item as any).id}
                              className="w-10 h-10 flex items-center justify-center font-black transition-all disabled:opacity-40"
                              style={{ background: 'transparent', border: `2px solid ${text}40`, color: text }}
                            >
                              {cancelling === (item as any).id
                                ? <span className="text-[10px]">…</span>
                                : <XCircle className="w-4 h-4" />
                              }
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Perforated ticket bottom */}
                      <div className="flex items-center overflow-hidden" style={{ borderTop: `2px dashed ${text}30` }}>
                        {Array.from({ length: 24 }, (_, k) => (
                          <div key={k} className="h-3 flex-1" style={{ background: k % 2 === 0 ? `${text}08` : 'transparent' }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}