'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { format } from 'date-fns';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadEvents(); }, [page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getActiveEvents(page, 9);
      setEvents(response.data.events || []);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Retro color combos [bg, text, accent]
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

  if (loading && page === 1) {
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

  return (
    <div className="min-h-screen" style={{ background: '#FAF0DC' }}>

      {/* ── HEADER POSTER ── */}
      <div className="relative overflow-hidden pt-24 pb-0" style={{ background: '#1A1A2E' }}>

        {/* Big concentric arcs decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          {[520, 420, 320, 220].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: size,
                height: size,
                borderColor: i % 2 === 0 ? 'rgba(245,200,66,0.12)' : 'rgba(232,67,26,0.12)',
                top: '50%',
                left: '50%',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 text-center pb-16 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Wavy subtitle */}
            <p className="text-[#F5C842] text-[10px] font-black uppercase tracking-[0.6em] mb-6">
              ✦ Ethiopia's Premier Amusement Park ✦
            </p>

            {/* Stacked arched title — retro concert poster */}
            <div className="relative">
              <h1
                className="font-black uppercase leading-none text-[#FAF0DC]"
                style={{
                  fontFamily: "'Arial Black', sans-serif",
                  fontSize: 'clamp(3rem, 12vw, 9rem)',
                  letterSpacing: '-0.02em',
                }}
              >
                EVENTS
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
                style={{
                  fontFamily: "'Arial Black', sans-serif",
                  fontSize: 'clamp(2.2rem, 8vw, 6rem)',
                  letterSpacing: '-0.02em',
                  color: '#F5C842',
                }}
              >
                &amp; SHOWS
              </h1>
            </div>

            <p className="text-[#FAF0DC]/40 text-sm mt-6 tracking-wide" style={{ fontFamily: 'sans-serif', fontWeight: 300 }}>
              Book your tickets · Secure your spot · Create memories
            </p>
          </motion.div>
        </div>

        {/* Zigzag bottom border */}
        <svg viewBox="0 0 1200 30" className="w-full" preserveAspectRatio="none" style={{ display: 'block' }}>
          <polyline
            points={Array.from({ length: 61 }, (_, i) => `${i * 20},${i % 2 === 0 ? 30 : 0}`).join(' ')}
            fill="none"
            stroke="#FAF0DC"
            strokeWidth="2"
          />
          <polygon
            points={`0,30 ${Array.from({ length: 61 }, (_, i) => `${i * 20},${i % 2 === 0 ? 30 : 0}`).join(' ')} 1200,30`}
            fill="#FAF0DC"
          />
        </svg>
      </div>

      {/* ── EVENTS GRID ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-14 pb-28">

        {error && (
          <p className="text-[#E8431A] text-sm mb-8 p-4 border-2 border-[#E8431A] font-sans">{error}</p>
        )}

        {events.length === 0 && !loading ? (
          <div className="text-center py-32">
            <p className="text-6xl mb-4">🎪</p>
            <h3 className="text-3xl font-black uppercase text-[#1A1A2E] mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              No Shows Yet
            </h3>
            <p className="text-[#1A1A2E]/40 font-sans text-sm">Check back soon!</p>
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {events.map((event, i) => {
                  const [bg, text, accent] = palettes[i % palettes.length];
                  const soldOut = event.tickets_sold >= event.capacity;
                  const price = event.ticket_types?.find(t => t.category === 'adult')?.price ?? 0;

                  return (
                    <motion.div
                      key={event.id}
                      variants={{
                        hidden: { opacity: 0, rotate: -1, scale: 0.97 },
                        visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.5 } },
                      }}
                      whileHover={{ scale: 1.03, rotate: i % 2 === 0 ? 0.8 : -0.8, transition: { duration: 0.2 } }}
                    >
                      <Link href={`/events/${event.id}`}>
                        <div
                          className="relative cursor-pointer overflow-hidden"
                          style={{
                            background: bg,
                            border: `3px solid ${text}`,
                            padding: '0',
                          }}
                        >
                          {/* Top bar with day name */}
                          <div
                            className="px-5 py-2 flex items-center justify-between"
                            style={{ background: text, color: accent }}
                          >
                            <span className="font-black text-[10px] uppercase tracking-[0.4em]">
                              {format(new Date(event.event_date), 'EEEE')}
                            </span>
                            <span className="font-black text-[10px] uppercase tracking-[0.4em]">
                              {soldOut ? '✕ SOLD OUT' : `${event.available_tickets ?? event.capacity - event.tickets_sold} left`}
                            </span>
                          </div>

                          {/* Main content */}
                          <div className="p-6">
                            {/* Giant date */}
                            <div className="flex items-end justify-between mb-4">
                              <div>
                                <p
                                  className="font-black leading-none"
                                  style={{
                                    fontFamily: "'Arial Black', sans-serif",
                                    fontSize: 'clamp(3rem, 8vw, 5rem)',
                                    color: accent,
                                    lineHeight: 0.85,
                                  }}
                                >
                                  {format(new Date(event.event_date), 'd')}
                                </p>
                                <p
                                  className="font-black uppercase tracking-wider text-sm"
                                  style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif' }}
                                >
                                  {format(new Date(event.event_date), 'MMM yyyy')}
                                </p>
                              </div>
                              {/* Decorative circle */}
                              <div
                                className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
                                style={{ borderColor: accent, background: 'transparent' }}
                              >
                                <span className="font-black text-[10px] text-center uppercase leading-tight"
                                  style={{ color: accent, fontFamily: 'sans-serif' }}
                                >
                                  {price}<br />ETB
                                </span>
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="my-4 border-t-2" style={{ borderColor: `${text}20` }} />

                            {/* Title — big stretched type */}
                            <h3
                              className="font-black uppercase leading-tight mb-3"
                              style={{
                                fontFamily: "'Arial Black', sans-serif",
                                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                                color: text,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {event.name}
                            </h3>

                            <p
                              className="text-xs leading-relaxed line-clamp-2 mb-5"
                              style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif', fontWeight: 300 }}
                            >
                              {event.description || 'An unforgettable experience at Bora Park.'}
                            </p>

                            {/* Time row */}
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[10px] font-black uppercase tracking-[0.3em]"
                                style={{ color: text, opacity: 0.4, fontFamily: 'sans-serif' }}
                              >
                                {event.start_time} – {event.end_time}
                              </span>
                              {!soldOut && (
                                <div
                                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5"
                                  style={{ background: accent, color: text === '#FAF0DC' ? '#1A1A2E' : bg }}
                                >
                                  GET TIX →
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Ticket stub perforated bottom */}
                          <div
                            className="flex items-center gap-0 overflow-hidden"
                            style={{ borderTop: `2px dashed ${text}30` }}
                          >
                            {Array.from({ length: 24 }, (_, k) => (
                              <div
                                key={k}
                                className="h-3 flex-1"
                                style={{ background: k % 2 === 0 ? `${text}08` : 'transparent' }}
                              />
                            ))}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-16">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-5 py-2 font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all"
                  style={{ background: '#1A1A2E', color: '#F5C842', border: '3px solid #1A1A2E', fontFamily: "'Arial Black', sans-serif" }}
                >
                  ← PREV
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-9 h-9 font-black text-xs transition-all"
                    style={{
                      background: p === page ? '#E8431A' : 'transparent',
                      color: p === page ? '#FAF0DC' : '#1A1A2E',
                      border: '3px solid #1A1A2E',
                      fontFamily: "'Arial Black', sans-serif",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="px-5 py-2 font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all"
                  style={{ background: '#1A1A2E', color: '#F5C842', border: '3px solid #1A1A2E', fontFamily: "'Arial Black', sans-serif" }}
                >
                  NEXT →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}