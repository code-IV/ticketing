"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { eventService } from "@/services/eventService";
import { Event } from "@/types";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function EventsPage() {
  const { isDarkTheme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // State for banner cycling
  const [bannerIndexes, setBannerIndexes] = useState<{ [key: string]: number }>(
    {},
  );
  const intervalRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // 1. Load Events Function
  const loadEvents = async () => {
    try {
      if (!initialLoad) setLoading(false); // Don't show loading after initial load
      const response = await eventService.getActiveEvents(page, itemsPerPage);

      if (response.success && response.data) {
        setEvents(response.data.events || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setEvents([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Failed to load events:", err);
      setEvents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // 2. Main Data Fetching Effect
  useEffect(() => {
    loadEvents();
  }, [page, itemsPerPage]);

  // 3. Responsive Items Per Page with Debounce
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1024) setItemsPerPage(5);
      else if (width >= 768) setItemsPerPage(4);
      else setItemsPerPage(3);
    };

    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateItemsPerPage, 300);
    };

    updateItemsPerPage();
    window.addEventListener("resize", debouncedUpdate);
    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      clearTimeout(debounceTimer);
    };
  }, []);

  // 4. Reset to page 1 on resize
  useEffect(() => {
    setPage(1);
  }, [itemsPerPage]);

  // 5. Banner Cycling Logic
  useEffect(() => {
    // Clear all existing intervals first
    Object.values(intervalRefs.current).forEach(clearInterval);
    intervalRefs.current = {};

    events.forEach((event) => {
      const posters =
        event.gallery?.filter((item) => item.label === "poster") || [];
      if (posters.length > 1) {
        intervalRefs.current[event.id] = setInterval(() => {
          setBannerIndexes((prev) => {
            const currentIndex = prev[event.id] || 0;
            const nextIndex = (currentIndex + 1) % posters.length;
            return {
              ...prev,
              [event.id]: nextIndex,
            };
          });
        }, 5000);
      }
    });

    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, [events]);

  // 6. Helpers
  const getBannerImage = (event: Event) => {
    const posters =
      event.gallery?.filter((item) => item.label === "poster") || [];
    const index = bannerIndexes[event.id] || 0;
    return posters[index] || null;
  };

  const isVideoPoster = (poster: any) => {
    if (!poster) return false;
    // Check both the type field and file extension
    return poster.type === "VIDEO" || 
           poster.url?.includes('.mp4') || 
           poster.url?.includes('.webm') || 
           poster.url?.includes('.mov');
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handlePageClick = (pageNumber: number) => {
    setPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && initialLoad) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"}`}
      >
        <div className="w-12 h-12 border-4 border-[#ffd84f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"} pb-20`}
    >
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-40"
          style={{
            background: "radial-gradient(circle, #ffd84f 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-40"
          style={{
            background: "radial-gradient(circle, #ffd84f 0%, transparent 70%)",
          }}
        />
      </div>

      <header
        className={`${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"} pt-16 pb-24 px-4 md:px-6 -mb-10`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Upcoming <span className="text-[#ffd84f]">Events</span>
          </motion.h1>
        </div>
      </header>

      <main className="max-w-7xl  mx-auto px-4 ">
        <div className="flex flex-col gap-8 md:gap-7">
          {events.map((event, i) => {
            const soldOut = event.ticketsSold >= event.capacity;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                className={`group relative ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"} rounded-[40px] border border-[#ffd84f] shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-700 flex flex-col lg:flex-row overflow-hidden min-h-100`}
              >
                {/* MEDIA */}
                <div className="relative h-64 lg:h-auto lg:w-112.5 shrink-0 overflow-hidden bg-[#ffd84f]">
                  {(() => {
                    const poster = getBannerImage(event);
                    
                    if (!poster) {
                      return (
                        <img
                          src="/l.jpg"
                          crossOrigin="anonymous"
                          alt={event.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 blur-sm"
                        />
                      );
                    }
                    
                    const posterUrl = poster.url;
                    const isVideo = isVideoPoster(poster);
                    
                    if (isVideo) {
                      return (
                        <video
                          src={posterUrl}
                          autoPlay
                          crossOrigin="anonymous"

                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      );
                    } else {
                      return (
                        <img
                          src={posterUrl}
                          crossOrigin="anonymous"
                          alt={event.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      );
                    }
                  })()}
                  <div className="absolute top-4 left-4">
                    <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-[#ffd84f] uppercase tracking-widest leading-none mb-1">
                        Stock
                      </p>
                      <p className="text-xl font-black text-white">
                        {Math.max(0, event.capacity - event.ticketsSold)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CONTENT */}
                <div
                  className={`flex-1 p-6 lg:p-10 flex flex-col ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                >
                  <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-4 leading-tight">
                    {event.name}
                  </h2>
                  <p
                    className={`mb-2 text-sm md:text-base leading-relaxed line-clamp-3 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {event.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-5 pt-6  border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#ffd84f] uppercase tracking-widest">
                          Date
                        </span>
                        <span className="text-xl font-black uppercase tracking-tighter">
                          {format(new Date(event.eventDate), "MMM dd")}
                        </span>
                      </div>
                      <div
                        className={`w-px h-8 ${isDarkTheme ? "bg-gray-700" : "bg-gray-200"}`}
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#ffd84f] uppercase tracking-widest">
                          Starts
                        </span>
                        <span className="text-xl font-black tracking-tighter">
                          {event.startTime.replace(":00", "")}
                        </span>
                      </div>
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <button
                        disabled={soldOut}
                        className={`px-5 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${soldOut ? "bg-gray-200 text-gray-400" : "bg-accent2 text-white hover:bg-accent hover:text-black shadow-lg"}`}
                      >
                        {soldOut ? "Sold Out" : "Check Out"}
                      </button>
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
        <div className="max-w-7xl mx-auto px-4 mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousPage}
              disabled={page === 1}
              className="p-4 rounded-2xl bg-[#ffd84f] text-black disabled:opacity-30 transition-all hover:scale-110"
            >
              <ChevronLeft size={20} />
            </button>
            <span
              className={`font-black text-lg ${isDarkTheme ? "text-white" : "text-black"}`}
            >
              {page} <span className="text-[#ffd84f]">/</span> {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="p-4 rounded-2xl bg-[#ffd84f] text-black disabled:opacity-30 transition-all hover:scale-110"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className={`h-1 rounded-full transition-all ${page === n ? "w-8 bg-[#ffd84f]" : "w-2 bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
