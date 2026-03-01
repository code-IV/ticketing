'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { format } from 'date-fns';
import { Clock, ArrowRight, MapPin, Sparkles, Calendar, Play, Image as ImageIcon } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadEvents(); }, [page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getActiveEvents(page, 10);
      setEvents(response.data.events || []);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Mock Media (Replace with event.image_url or event.video_url from DB)
  const MOCK_IMG = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop";
  const MOCK_VID = "https://assets.mixkit.co/videos/preview/mixkit-crowd-at-a-concert-with-lights-out-focus-4874-large.mp4";

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <header className="bg-slate-900 pt-16 pb-24 px-4 md:px-6 mb-[-40px]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4 border border-indigo-500/20">
              <Sparkles size={10} /> Immersive Experiences
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
              The <span className="text-indigo-500">Media</span> Hub
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col gap-8 md:gap-12">
          {events.map((event, i) => {
            const soldOut = event.tickets_sold >= event.capacity;
            const price = event.ticket_types?.find(t => t.category === 'adult')?.price ?? 0;
            const videoUrl = event.video_url || MOCK_VID; // Use DB video or Mock

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col lg:flex-row overflow-hidden min-h-[400px]"
              >
                {/* ── MEDIA CONTAINER (VIDEO + IMAGE) ── */}
                <div className="relative h-64 sm:h-80 lg:h-auto lg:w-[450px] xl:w-[550px] shrink-0 overflow-hidden bg-slate-900">
                  {/* Background Image */}
                  <img 
                    src={event.image_url || MOCK_IMG} 
                    alt={event.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                  />
                  
                  {/* Background Video (Plays on Hover) */}
                  <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-105"
                  />

                  {/* Media Type Badges */}
                  <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex gap-2">
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-white border border-white/10">
                      <ImageIcon size={16} />
                    </div>
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                      <Play size={16} fill="currentColor" />
                    </div>
                  </div>

                  {/* Floating Price */}
                  <div className="absolute top-4 left-4 md:top-8 md:left-8">
                    <div className="bg-white/95 backdrop-blur-md px-4 py-2 md:px-5 md:py-3 rounded-[18px] md:rounded-[24px] shadow-xl border border-white/10">
                      <p className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Passes</p>
                      <p className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">{price} ETB</p>
                    </div>
                  </div>
                </div>

                {/* ── CONTENT SECTION ── */}
                <div className="flex-1 p-6 md:p-10 lg:p-14 flex flex-col">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Date</span>
                      <span className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tighter">
                        {format(new Date(event.event_date), 'MMM dd')}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-100" />
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                       <Clock size={14} /> {event.start_time}
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-tight group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </h3>

                  <p className="text-slate-500 text-sm md:text-lg font-medium leading-relaxed line-clamp-2 md:line-clamp-3 mb-8 max-w-2xl">
                    {event.description || "Experience the future of entertainment with high-definition visuals and world-class performances."}
                  </p>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-slate-900">
                      <MapPin className="text-indigo-500" size={18} />
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                        {event.location || "Main Arena"}
                      </span>
                    </div>

                    <Link href={`/events/${event.id}`} className="w-full sm:w-auto">
                      <button 
                        disabled={soldOut}
                        className={`
                          w-full flex items-center justify-center gap-4 px-10 py-5 rounded-[20px] md:rounded-[24px] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] transition-all
                          ${soldOut 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl shadow-indigo-100'}
                        `}
                      >
                        {soldOut ? 'Full' : 'Check Out'} <ArrowRight size={18} />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}