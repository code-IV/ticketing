'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { format } from 'date-fns';
import { Clock, ArrowRight, MapPin, Sparkles, Calendar, Play, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function EventsPage() {
  const { isDarkTheme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadEvents(); }, [page]);

  const handlePreviousPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Use mock data for now to support guest users without backend
      const mockEvents = [
        {
          id: "1",
          name: "Summer Music Festival",
          description: "Experience the ultimate summer celebration with top artists and live performances",
          event_date: "2024-07-15",
          start_time: "18:00",
          end_time: "23:00",
          capacity: 5000,
          tickets_sold: 3200,
          available_tickets: 1800,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          ticket_types: [
            {
              id: "1",
              event_id: "1",
              name: "VIP Pass",
              category: "ADULT" as const,
              price: 1500,
              description: "Premium access with backstage pass",
              max_quantity_per_booking: 4,
              is_active: true,
              created_at: "",
              updated_at: ""
            },
            {
              id: "2",
              event_id: "1",
              name: "General Admission",
              category: "ADULT" as const,
              price: 500,
              description: "Standard entry access",
              max_quantity_per_booking: 10,
              is_active: true,
              created_at: "",
              updated_at: ""
            }
          ],
          location: "Main Arena",
          image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
          video_url: "https://assets.mixkit.co/videos/preview/mixkit-crowd-at-a-concert-with-lights-out-focus-4874-large.mp4"
        },
        {
          id: "2",
          name: "Food & Wine Expo",
          description: "Savor exquisite cuisines and fine wines from renowned chefs and vineyards",
          event_date: "2024-08-20",
          start_time: "12:00",
          end_time: "22:00",
          capacity: 2000,
          tickets_sold: 1500,
          available_tickets: 500,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          ticket_types: [
            {
              id: "3",
              event_id: "2",
              name: "Tasting Pass",
              category: "ADULT" as const,
              price: 800,
              description: "All-inclusive tasting experience",
              max_quantity_per_booking: 6,
              is_active: true,
              created_at: "",
              updated_at: ""
            }
          ],
          location: "Convention Center",
          image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
          video_url: ""
        },
        {
          id: "3",
          name: "Kids Carnival",
          description: "A magical day of fun, games, and adventures for children of all ages",
          event_date: "2024-09-10",
          start_time: "10:00",
          end_time: "18:00",
          capacity: 3000,
          tickets_sold: 2800,
          available_tickets: 200,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          ticket_types: [
            {
              id: "4",
              event_id: "3",
              name: "Child Ticket",
              category: "CHILD" as const,
              price: 200,
              description: "Access for children under 12",
              max_quantity_per_booking: 8,
              is_active: true,
              created_at: "",
              updated_at: ""
            },
            {
              id: "5",
              event_id: "3",
              name: "Family Pack",
              category: "GROUP" as const,
              price: 600,
              description: "2 adults + 2 children",
              max_quantity_per_booking: 4,
              is_active: true,
              created_at: "",
              updated_at: ""
            }
          ],
          location: "Family Zone",
          image_url: "https://images.unsplash.com/photo-1606989215512-5e5a89b164d5?q=80&w=1200&auto=format&fit=crop",
          video_url: ""
        }
      ];
      
      setEvents(mockEvents);
      setTotalPages(1);
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F8FAFC]'}`}>
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F8FAFC]'} pb-20`}>
      {/* Abstract shapes in background with #ffd84f */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(255,216,79,${isDarkTheme ? 0.4 : 0.8}) 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(255,216,79,${isDarkTheme ? 0.4 : 0.8}) 0%, transparent 70%)` }}
        />
      </div>
      <header className={`${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-bg2'} pt-16 pb-24 px-4 md:px-6 mb-[-40px]`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>

            <motion.h1 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className={`text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}
            >
              The <span className="text-accent2 ">Media</span> Hub
            </motion.h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col gap-8 md:gap-12">
          {events.map((event, i) => {
            const soldOut = event.tickets_sold >= event.capacity;
            const price = event.ticket_types?.find(t => t.category === 'ADULT')?.price ?? 0;
            const videoUrl = event.video_url || MOCK_VID; // Use DB video or Mock

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                className={`group relative ${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-[#F8FAFC]'} rounded-[32px] md:rounded-[48px] border border-accent shadow-sm hover:shadow-2xl hover:scale-105 transition-all duration-700 flex flex-col lg:flex-row overflow-hidden min-h-[400px]`}
              >
                {/* ── MEDIA CONTAINER (VIDEO + IMAGE) ── */}
                <div className="relative h-64 sm:h-80 lg:h-auto lg:w-[450px] xl:w-[550px] shrink-0 overflow-hidden bg-[#f4c000]">
                  {/* Background Image */}
                  <img 
                    src={event.image_url || MOCK_IMG} 
                    alt={event.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Background Video (Plays on Hover) */}
                  <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 scale-105"
                  />

                  {/* Media Type Badges */}
                  <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex gap-2">
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-white border border-white/10">
                      <ImageIcon size={16} />
                    </div>
                    <div className="bg-accent p-2 rounded-xl text-white shadow-lg shadow-accent/20">
                      <Play size={16} fill="currentColor" />
                    </div>
                  </div>

                  {/* Floating Price */}
                  <div className="absolute top-4 left-4 md:top-8 md:left-8">
                    <div className={`${isDarkTheme ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-md px-4 py-2 md:px-5 md:py-3 rounded-[18px] md:rounded-[24px] shadow-xl border border-white/10`}>
                      <p className="text-[8px] md:text-[10px] font-black text-accent2 uppercase tracking-widest leading-none mb-1">Passes</p>
                      <p className={`text-lg md:text-2xl font-black tracking-tighter ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{price} ETB</p>
                    </div>
                  </div>
                </div>

                {/* ── CONTENT SECTION ── */}
                <div className={`flex-1 p-6 md:p-10 lg:p-14 flex flex-col ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[10px] font-black text-accent uppercase tracking-[0.2em]">Date</span>
                      <span className="text-sm md:text-xl font-black uppercase tracking-tighter">
                        {format(new Date(event.event_date), 'MMM dd')}
                      </span>
                    </div>
                    <div className={`w-px h-6 ${isDarkTheme ? 'bg-gray-600' : 'bg-slate-100'}`} />
                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`}>
                       <Clock size={14} /> {event.start_time}
                    </div>
                  </div>

                  <h3 className={`text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-4 leading-tight group-hover:text-accent transition-colors ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {event.name}
                  </h3>

                  <p className={`text-sm md:text-lg font-medium leading-relaxed line-clamp-2 md:line-clamp-3 mb-8 max-w-2xl ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                    {event.description || "Experience the future of entertainment with high-definition visuals and world-class performances."}
                  </p>

                  <div className={`mt-auto pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6 ${isDarkTheme ? 'border-gray-700' : 'border-slate-50'}`}>
                    <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      <MapPin className="text-accent2" size={18} />
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
                            : 'bg-[#1a1a1a] text-white hover:bg-yellow-500 shadow-xl shadow-accent/20'}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 pt-10">
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  page === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
                style={{
                  backgroundColor: page === 1 ? undefined : '#ffd84f',
                  color: page === 1 ? undefined : '#000'
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Page
                </span>
                <span className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {page}
                </span>
                <span className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  of {totalPages}
                </span>
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  page === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
                style={{
                  backgroundColor: page === totalPages ? undefined : '#ffd84f',
                  color: page === totalPages ? undefined : '#000'
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
            
            {/* Page indicator dots */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageClick(pageNumber)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    page === pageNumber
                      ? "w-8"
                      : ""
                  }`}
                  style={{
                    backgroundColor: page === pageNumber ? '#ffd84f' : isDarkTheme ? '#374151' : '#d1d5db'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}