'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { format } from 'date-fns';
import { Clock, ArrowRight, MapPin, Play, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function EventsPage() {
  const { isDarkTheme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const [bannerIndexes, setBannerIndexes] = useState<{[key: string]: number}>({});
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const intervalRefs = useRef<{[key: string]: NodeJS.Timeout}>({});

  // 1. Single loadEvents function
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getActiveEvents(page, itemsPerPage);
      
      if (response.success && response.data) {
        setEvents(response.data.events || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setEvents([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setEvents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [page, itemsPerPage]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1024) setItemsPerPage(5);
      else if (width >= 768) setItemsPerPage(4);
      else setItemsPerPage(3);
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  useEffect(() => { setPage(1); }, [itemsPerPage]);

  const handlePreviousPage = () => setPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setPage(prev => Math.min(totalPages, prev + 1));
  const handlePageClick = (pageNumber: number) => setPage(pageNumber);

  const getBannerImages = (event: Event) => {
    const banners = event.gallery?.filter(item => item.label === "banner") || [];
    return banners.length > 0 ? banners : [{ url: "/placeHolder.jpg", type: "image", label: "placeholder" }];
  };

  const getCurrentBanner = (event: Event) => {
    const banners = getBannerImages(event);
    const currentIndex = bannerIndexes[event.id] || 0;
    return banners[currentIndex];
  };

  useEffect(() => {
    const startCycling = (eventId: string) => {
      if (intervalRefs.current[eventId]) clearInterval(intervalRefs.current[eventId]);
      
      const event = events.find(e => e.id === eventId);
      const banners = event ? getBannerImages(event) : [];
      if (banners.length <= 1 || !visibleCards.has(eventId)) return;
      
      intervalRefs.current[eventId] = setInterval(() => {
        setBannerIndexes(prev => ({
          ...prev,
          [eventId]: ((prev[eventId] || 0) + 1) % banners.length
        }));
      }, 4000);
    };

    visibleCards.forEach(eventId => startCycling(eventId));
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, [events, visibleCards]);

  // Intersection Observer for visibility detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const eventId = entry.target.getAttribute('data-event-id');
          if (eventId) {
            setVisibleCards(prev => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(eventId);
              } else {
                newSet.delete(eventId);
              }
              return newSet;
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all event cards
    const cards = document.querySelectorAll('[data-event-id]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [events]);

  // Mock Media (Replace with event.image_url or event.video_url from DB)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const eventId = entry.target.getAttribute('data-event-id');
          if (eventId) {
            setVisibleCards(prev => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) newSet.add(eventId);
              else newSet.delete(eventId);
              return newSet;
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('[data-event-id]');
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [events]);

  if (loading && page === 1) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F8FAFC]'}`}>
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F8FAFC]'} pb-20`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(circle, #ffd84f 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(circle, #ffd84f 0%, transparent 70%)' }} />
      </div>

      <header className={`${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-white'} pt-16 pb-24 px-4 md:px-6 mb-[-40px]`}>
        <div className="max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}
          >
            Upcoming <span className="text-[#ffd84f]">Events</span>
          </motion.h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col gap-8 md:gap-12">
          {events.map((event, i) => {
            const soldOut = event.ticketsSold >= event.capacity;
            const price = event.ticketTypes?.find(t => t.category === 'ADULT')?.price ?? 0;

            return (
              <motion.div
                key={event.id}
                data-event-id={event.id}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                className={`group relative ${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-white'} rounded-[40px] border border-[#ffd84f] shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col lg:flex-row overflow-hidden min-h-[400px]`}
              >
                {/* MEDIA */}
                <div className="relative h-64 lg:h-auto lg:w-[450px] shrink-0 overflow-hidden bg-[#ffd84f]">
                  <img src={getCurrentBanner(event)?.url} alt={event.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 left-4">
                    <div className={`${isDarkTheme ? 'bg-black/90' : 'bg-white/90'} p-3 rounded-2xl border border-white/10`}>
                      <p className="text-[10px] font-black text-[#ffd84f] uppercase tracking-widest">Tickets Left</p>
                      <p className={`text-xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{Math.max(0, event.capacity - event.ticketsSold)}</p>
                    </div>
                  </div>
                </div>

                {/* CONTENT */}
                <div className={`flex-1 p-6 lg:p-10 flex flex-col ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                   <div className="flex items-center gap-6 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#ffd84f] uppercase tracking-widest">Date</span>
                      <span className="text-xl font-black uppercase">{format(new Date(event.eventDate), 'MMM dd')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#ffd84f] uppercase tracking-widest">Time</span>
                      <span className="text-xl font-black">{event.startTime}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-4">{event.name}</h2>
                  <p className={`mb-6 text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>{event.description || "Experience the future of entertainment with high-definition visuals and world-class performances."}</p>

                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#ffd84f] uppercase block">Price</span>
                      <span className="text-2xl font-black">{price} ETB</span>
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      className={`px-8 py-4 rounded-full font-black text-sm uppercase tracking-wider transition-all ${
                        soldOut ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#ffd84f] text-black hover:scale-105'
                      }`}
                    >
                      {soldOut ? 'Sold Out' : 'Get Tickets'}
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <button onClick={handlePreviousPage} disabled={page === 1} className="p-3 bg-[#1a1a1a] rounded-xl text-white disabled:opacity-50"><ChevronLeft /></button>
          <span className="font-black text-[#ffd84f]">{page} / {totalPages}</span>
          <button onClick={handleNextPage} disabled={page === totalPages} className="p-3 bg-[#1a1a1a] rounded-xl text-white disabled:opacity-50"><ChevronRight /></button>
        </div>
      )}
    </div>
  );
}