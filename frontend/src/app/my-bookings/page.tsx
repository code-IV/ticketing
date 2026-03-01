"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { Bookings, GameBookingItemDetail } from "@/types";
import { Button } from "@/components/ui/Button";
import { Calendar, Gamepad2, ChevronDown } from "lucide-react";
import { CiFilter } from "react-icons/ci"; 
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "Available" | "Fully Used" | "Pending">("ALL");
  const [usageFilter, setUsageFilter] = useState<"ALL" | "Available" | "Fully Used" | "Pending">("ALL");
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) loadBookings();
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings(1, 50);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  const getDynamicPassName = (items: GameBookingItemDetail[]) => {
    if (!items || items.length === 0) return "Custom Pass";
    const uniqueGames = [...new Set(items.map(i => i.game_name))];
    if (uniqueGames.length === 1) return uniqueGames[0];
    if (uniqueGames.length === 2) return `${uniqueGames[0]} & ${uniqueGames[1]}`;
    return `${uniqueGames[0]}, ${uniqueGames[1]} ...`;
  };

  const filteredItems = bookings.filter((item) => {
    const matchesTab = activeTab === "ALL" || item.type === activeTab;
    const totalQty = item.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
    const totalUsed = item.items?.reduce((acc, i) => acc + (i.used_quantity || 0), 0) || 0;
    
    let matchesUsage = true;
    if (usageFilter === "Available") matchesUsage = totalUsed === 0;
    if (usageFilter === "Fully Used") matchesUsage = totalUsed > 0 && totalUsed < totalQty;
    if (usageFilter === "Pending") matchesUsage = totalUsed === totalQty && totalQty > 0;

    return matchesTab && matchesUsage;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              My <span className="text-indigo-600">Tickets</span>
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Your Bora Park adventure tracker.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <button onClick={() => setIsUsageOpen(!isUsageOpen)} className="w-full flex items-center justify-between sm:justify-start gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 shadow-sm">
                <CiFilter className="text-lg text-indigo-600" />
                <span className="uppercase">{usageFilter === "ALL" ? "All Usage" : usageFilter}</span>
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {isUsageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5"
                  >
                    {(["ALL", "Available", "Fully Used", "Pending"] as const).map((usage) => (
                      <button
                        key={usage}
                        onClick={() => {
                          setUsageFilter(usage);
                          setIsUsageOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase rounded-lg transition-colors ${
                          usageFilter === usage 
                            ? "text-indigo-600 bg-indigo-50" 
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {usage}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full sm:w-auto border border-slate-200/50">
              {(["ALL", "EVENT", "GAME"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
               const totalQty = item.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
               const totalUsed = item.items?.reduce((acc, i) => acc + (i.used_quantity || 0), 0) || 0;
               const isFinished = totalUsed === totalQty;

               return (
                <motion.div layout key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-white rounded-[32px] md:rounded-[24px] border border-slate-100 overflow-hidden flex flex-col md:flex-row shadow-sm transition-all ${isFinished ? 'opacity-60 grayscale-[0.4]' : ''}`}
                  style={{
                    clipPath: 'polygon(0 24px, 24px 0, calc(100% - 24px) 0, 100% 24px, 100% calc(100% - 24px), calc(100% - 24px) 100%, 24px 100%, 0 calc(100% - 24px))'
                  }}
                >
                  
                  {/* MOBILE TOP BAR / TABLET SIDE BAR */}
                  <div className={`w-full md:w-32 flex md:flex-col items-center justify-between md:justify-center p-5 md:p-6 ${item.type === "EVENT" ? "bg-blue-50/50 text-blue-600" : "bg-purple-50/50 text-purple-600"}`}>
                    <div className="p-2 bg-white rounded-xl md:bg-transparent md:p-0">
                        {item.type === "EVENT" ? <Calendar size={28} /> : <Gamepad2 size={28} />}
                    </div>
                    <span className="md:mt-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        {item.type}
                    </span>
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="text-center md:text-left">
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                            {item.type === "GAME" ? getDynamicPassName(item.items) : item.event_name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: #{item.booking_reference.slice(0, 8)}</p>
                      </div>
                      
                      <div className={`self-center md:self-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isFinished ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {isFinished ? "Used Up" : totalUsed > 0 ? "In Progress" : "Available"}
                      </div>
                    </div>

                    {/* STATS: Mobile (Rows) vs Tablet (Grid) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                      <div className="bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-2xl flex flex-col">
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-1">Pass Status</span>
                        <span className="text-sm font-black text-slate-700">{totalUsed}/{totalQty} Used</span>
                      </div>
                      <div className="bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-2xl flex flex-col">
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-1">Ready</span>
                        <span className="text-sm font-black text-indigo-600">{totalQty - totalUsed} Tickets</span>
                      </div>
                      <div className="hidden md:flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Date</span>
                        <span className="text-sm font-bold text-slate-700">{item.type === "EVENT" ? format(new Date(item.event_date), "MMM dd") : "Anytime"}</span>
                      </div>
                      <div className="bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-2xl flex flex-col">
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-1">Price</span>
                        <span className="text-sm font-black text-slate-700">{Math.round(parseFloat(item.total_amount))} ETB</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(totalUsed / totalQty) * 100}%` }} className={`h-full ${isFinished ? 'bg-slate-400' : 'bg-indigo-600'}`} />
                    </div>
                  </div>

                  {/* ACTION: Full width on mobile, side-aligned on desktop */}
                  <div className="p-4 md:p-8 bg-slate-50/50 md:bg-transparent border-t md:border-t-0 md:border-l border-slate-100 flex items-center justify-center">
                    <Button onClick={() => router.push(item.type === "GAME" ? `/my-bookings/${item.id}` : `/bookings/${item.id}`)} className="w-full md:w-auto rounded-2xl md:rounded-xl bg-slate-900 text-white font-bold py-6 md:py-2 md:px-8">
                      VIEW TICKET
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}