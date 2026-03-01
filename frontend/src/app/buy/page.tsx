"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  Ticket, 
  ShoppingCart, 
  Zap, 
  Plus, 
  Minus, 
  Info, 
  Sparkles, 
  ArrowRight, 
  MapPin,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Game } from "@/types";
import { gameService } from "@/services/adminService";
import { bookingService } from "@/services/bookingService";

const gameVisuals = [
  { emoji: "🎢", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop" },
  { emoji: "🎡", image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=600&h=800&fit=crop" },
  { emoji: "🚗", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=800&fit=crop" },
  { emoji: "👻", image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=600&h=800&fit=crop" },
  { emoji: "🎠", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=800&fit=crop" },
  { emoji: "🎯", image: "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=600&h=800&fit=crop" },
];

const BuyTicketsPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGameId, setOpenGameId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Visibility Tracking
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGames();

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSummaryVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } 
    );

    if (summaryRef.current) {
      observer.observe(summaryRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await gameService.getAll();
      setGames(response.data || []);
    } catch (error) {
      setError("Failed to load adventures.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (gameId: string, category: string, delta: number) => {
    setCart((prev) => {
      const gameSelection = prev[gameId] || {};
      const currentQty = gameSelection[category] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const updatedGameSelection = { ...gameSelection, [category]: newQty };
      if (newQty === 0) delete updatedGameSelection[category];
      if (Object.keys(updatedGameSelection).length === 0) {
        const { [gameId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [gameId]: updatedGameSelection };
    });
  };

  const total = Object.entries(cart).reduce((grandTotal, [gameId, selections]) => {
    const game = games?.find((g) => g.id === gameId);
    const gameTotal = Object.entries(selections).reduce((sum, [cat, qty]) => {
      const price = game?.ticket_types?.find((t) => t.category === cat)?.price || 0;
      return sum + price * qty;
    }, 0);
    return grandTotal + gameTotal;
  }, 0);

  const scrollToSummary = () => {
    summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCheckout = async () => {
    if (total === 0) return;
    setBookingLoading(true);
    try {
      const itemsPayload = [];
      for (const [gameId, selections] of Object.entries(cart)) {
        const gameData = games?.find((g) => g.id === gameId);
        if (!gameData) continue;
        for (const [category, quantity] of Object.entries(selections)) {
          const ticketType = gameData.ticket_types?.find((t) => t.category === category);
          if (ticketType) {
            itemsPayload.push({
              ticketTypeId: ticketType.id,
              category,
              quantity,
              unitPrice: ticketType.price,
              gameId,
            });
          }
        }
      }
      await bookingService.createBookingGames({
        items: itemsPayload,
        totalAmount: total,
        paymentMethod: "telebirr",
        guestEmail: "guest@bora.com",
        guestName: "Explorer User",
      });
      alert("Adventure Booked!");
    } catch (err) {
      alert("Booking failed.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 pt-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-200">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic">
                Pick Your <span className="text-indigo-600">Adventures</span>
              </h1>
              <p className="text-slate-500 mt-1 text-sm font-medium tracking-wide">
                Select attraction passes to build your custom experience.
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 bg-white p-5 rounded-4xl border border-slate-100 shadow-sm">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected</p>
              <p className="text-xl font-black text-slate-900 italic">{Object.keys(cart).length} Games</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* GAMES LISTING */}
          <div className="lg:col-span-7">
            {loading ? (
              <div className="flex items-center justify-center py-40">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence>
                  {games.map((game, index) => {
                    const isOpen = openGameId === game.id;
                    const hasItems = !!cart[game.id];
                    const visual = gameVisuals[index % gameVisuals.length];
                    const lowestPrice = game.ticket_types?.length ? Math.min(...game.ticket_types.map(t => t.price)) : 0;

                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative min-h-[400px] rounded-[40px] overflow-hidden border-2 transition-all cursor-pointer ${
                          hasItems ? "border-indigo-600 ring-4 ring-indigo-50" : "border-transparent bg-white shadow-sm hover:shadow-xl"
                        }`}
                        onClick={() => setOpenGameId(isOpen ? null : game.id)}
                      >
                        <div className="absolute inset-0 h-full w-full">
                          <img src={visual.image} alt={game.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        </div>

                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white font-black text-[10px] uppercase tracking-widest">
                            {lowestPrice} ETB+
                          </div>
                          {hasItems && (
                            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg animate-pulse">
                              <Sparkles size={16} />
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                          <h3 className="font-black text-3xl text-white tracking-tighter leading-none uppercase italic mb-2">
                            {game.name}
                          </h3>
                          <p className="flex items-center gap-1.5 text-white/60 text-[10px] font-black uppercase tracking-widest mb-6">
                            <MapPin size={12} /> Bora Stage 0{index + 1}
                          </p>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-4 space-y-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {game.ticket_types?.map((tt) => {
                                  const qty = cart[game.id]?.[tt.category] || 0;
                                  return (
                                    <div key={tt.category} className="flex justify-between items-center bg-white/10 rounded-2xl p-3 border border-white/10">
                                      <div>
                                        <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">{tt.category}</p>
                                        <p className="text-white font-black text-sm">{tt.price} ETB</p>
                                      </div>
                                      <div className="flex items-center gap-3 bg-white/20 rounded-xl p-1 px-2">
                                        <button onClick={() => updateQuantity(game.id, tt.category, -1)} className="text-white hover:text-red-400"><Minus size={14}/></button>
                                        <span className="text-white font-black text-sm w-4 text-center">{qty}</span>
                                        <button onClick={() => updateQuantity(game.id, tt.category, 1)} className="text-white hover:text-indigo-400"><Plus size={14}/></button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ELEGANT FINAL SUMMARY SIDEBAR */}
          <aside ref={summaryRef} className="lg:col-span-5 scroll-mt-20">
            <div className="sticky top-10 flex flex-col gap-8">
              <div className="relative bg-white rounded-[48px] p-10 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[80px] -z-10" />
                
                <div className="relative">
                  <header className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Final Review</h3>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
                        Your <span className="text-slate-400">Order</span>
                      </h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                      <ShoppingCart size={20} />
                    </div>
                  </header>

                  <div className="space-y-8 mb-10">
                    {Object.keys(cart).length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                          <Ticket className="text-slate-300" size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cart is empty</p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {Object.entries(cart).map(([gameId, selections]) => {
                          const game = games?.find((g) => g.id === gameId);
                          return (
                            <motion.div key={gameId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{game?.name}</p>
                                </div>
                                <div className="h-px flex-1 bg-slate-100 mt-2" />
                              </div>
                              <div className="pl-5 space-y-2">
                                {Object.entries(selections).map(([category, qty]) => {
                                  const ticketInfo = game?.ticket_types?.find((t) => t.category === category);
                                  return (
                                    <div key={category} className="flex justify-between items-center text-[11px]">
                                      <p className="text-slate-500 font-bold uppercase tracking-wider">
                                        <span className="text-slate-900">{qty}x</span> {category}
                                      </p>
                                      <p className="font-mono font-bold text-slate-900">{(ticketInfo?.price || 0) * qty} ETB</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Amount Due</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter italic">{total}</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ETB</span>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={total === 0 || bookingLoading}
                    onClick={handleCheckout}
                    className="w-full mt-8 py-6 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-20 disabled:grayscale"
                  >
                    {bookingLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Confirm & Book <ArrowRight size={18} /></>}
                  </motion.button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── UPDATED GLASS CHECKOUT BAR (Mobile/Tablet) ── */}
      <AnimatePresence>
        {total > 0 && !isSummaryVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-8 left-0 right-0 z-50 px-6 lg:hidden"
          >
            <button
              onClick={scrollToSummary}
              className="w-full relative py-6 rounded-[32px] shadow-[0_25px_50px_rgba(0,0,0,0.15)] flex items-center justify-between px-8 overflow-hidden group border border-indigo-100/50"
            >
              {/* Cinematic Frosted Glass Background */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-xl group-hover:bg-white/30 transition-colors" />
              
              {/* Indigo Shimmer Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200/40 rounded-full blur-2xl -z-10" />

              {/* Text - High Contrast */}
              <div className="relative flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 opacity-90 mb-0.5">Adventure Total</span>
                <span className="text-2xl font-black italic tracking-tighter text-slate-950">{total} ETB</span>
              </div>
              
              {/* Action Badge */}
              <div className="relative flex items-center gap-2 font-black uppercase text-[10px] tracking-widest bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-200 border border-indigo-700/50">
                Summary <ChevronDown size={14} className="animate-bounce" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyTicketsPage;