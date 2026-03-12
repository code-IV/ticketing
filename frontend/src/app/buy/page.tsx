"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { gameService } from "@/services/gameService";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import SuccessModal from "@/components/ui/SuccessModal";

const gameVisuals = [
  { emoji: "🎢", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop" },
  { emoji: "🎡", image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=600&h=800&fit=crop" },
  { emoji: "🚗", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=800&fit=crop" },
  { emoji: "👻", image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=600&h=800&fit=crop" },
  { emoji: "🎠", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=800&fit=crop" },
  { emoji: "🎯", image: "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=600&h=800&fit=crop" },
];

const BuyTicketsPage = () => {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGameId, setOpenGameId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingReference, setBookingReference] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  
  // Visibility Tracking
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const { isDarkTheme } = useTheme();
  const { user } = useAuth();

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
      const response = await gameService.getActiveGames();
      setGames(response.data.games || []);
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
      const result = await bookingService.createBookingGames({
        items: itemsPayload,
        totalAmount: total,
        paymentMethod: "telebirr",
        guestEmail: user?.email || "guest@bora.com",
        guestName: user ? `${user.first_name} ${user.last_name}` : "Guest User",
      });
      // Extract booking data from API response
      const booking = result?.data?.booking;
      if (booking) {
        // For games API, the response structure is different
        setBookingReference(booking.bookingReference || "BORA-" + Date.now());
        setBookingId(booking.id || "");
        setShowSuccessModal(true);
        setCart({}); // Clear cart after successful booking
      }
    } catch (err) {
      console.error("Booking failed:", err);
      // You could add an error modal here too
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F8FAFC]'} pb-32 pt-10 px-4`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-accent2 p-4 rounded-3xl shadow-xl shadow-accent2/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="text-center md:text-left">
              <h1 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase italic ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Pick Your <span className="text-accent2">Adventures</span>
              </h1>
              <p className={`text-sm font-medium tracking-wide mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                Select attraction passes to build your custom experience.
              </p>
            </div>
          </div>
          
          <div className={`hidden sm:flex items-center gap-4 p-5  border rounded-4xl shadow-sm ${isDarkTheme ? 'bg-bg3 border-accent' : 'bg-white border-accent'}`}>
            <div className="text-right">
              <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`}>Selected</p>
              <p className={`text-xl font-black italic ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{Object.keys(cart).length} Games</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* GAMES LISTING */}
          <div className="lg:col-span-7">
            {loading ? (
              <div className="flex items-center justify-center py-40">
                <div className="w-12 h-12 border-4  border-t-transparent rounded-full animate-spin" />
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
                          hasItems ? " ring-4 ring-indigo-50" : `border-transparent shadow-sm hover:shadow-xl ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`
                        }`}
                        onClick={(e) => {
  // Check if the click target is the "View Details" button
  const target = e.target as HTMLElement;
  if (target.closest('button')) {
    // Don't handle the click if it's on a button
    return;
  }
  setOpenGameId(isOpen ? null : game.id);
}}
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
                            <div className="bg-accent2 text-white p-2 rounded-xl shadow-lg animate-pulse">
                              <Sparkles size={16} />
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-0  left-0 right-0 p-8 z-10">
                          <h3 className="font-black text-3xl text-white tracking-tighter leading-none uppercase italic mb-2">
                            {game.name}
                          </h3>
                          <p className="flex items-center gap-1.5 text-white/60 text-[10px] font-black uppercase tracking-widest mb-4">
                            <MapPin size={12} /> Bora Stage 0{index + 1}
                          </p>
                          
                          <button
                            onClick={(e) => {
                              console.log('Game object:', game);
                              console.log('Game ID:', game.id);
                              console.log('Game ID type:', typeof game.id);
                              console.log('View Details clicked for game:', game.id);
                              console.log('Navigating to:', `/buy/${game.id}`);
                              window.location.href = `/buy/${game.id}`;
                            }}
                            className="relative z-20 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/30 transition-colors"
                          >
                            View Details
                          </button>

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
          <aside ref={summaryRef} className="lg:col-span-5  scroll-mt-20">
            <div className="sticky top-10 flex flex-col gap-8">
              <div className={`relative rounded-[48px]  p-10 border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden ${isDarkTheme ? 'bg-bg3 border-accent ' : 'bg-white border-accent2'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[80px] -z-10 ${isDarkTheme ? 'bg-bg3' : 'bg-indigo-50/50'}`} />
                
                <div className="relative">
                  <header className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent2 mb-1">Final Review</h3>
                      <h2 className={`text-3xl font-black tracking-tighter italic uppercase ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        Your <span className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`}>Order</span>
                      </h2>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border stroke-2 ${isDarkTheme ? 'bg-bg1 text-accent  border-gray-600' : 'bg-slate-50 text-slate-900 border-slate-100'}`}>
                      <ShoppingCart size={20} />
                    </div>
                  </header>

                  <div className="space-y-8 mb-10">
                    {Object.keys(cart).length === 0 ? (
                      <div className="py-12 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                          <Ticket className={`${isDarkTheme ? 'text-gray-500' : 'text-slate-300'}`} size={24} />
                        </div>
                        <p className={`text-sm font-bold uppercase tracking-widest ${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`}>Cart is empty</p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {Object.entries(cart).map(([gameId, selections]) => {
                          const game = games?.find((g) => g.id === gameId);
                          return (
                            <motion.div key={gameId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-accent" />
                                  <p className={`text-xs font-black uppercase tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{game?.name}</p>
                                </div>
                                <div className={`h-px flex-1 ${isDarkTheme ? 'bg-gray-700' : 'bg-slate-100'} mt-2`} />
                              </div>
                              <div className="pl-5 space-y-2">
                                {Object.entries(selections).map(([category, qty]) => {
                                  const ticketInfo = game?.ticket_types?.find((t) => t.category === category);
                                  return (
                                    <div key={category} className="flex justify-between items-center text-[11px]">
                                      <p className={`font-bold uppercase tracking-wider ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                                        <span className={`${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{qty}x</span> {category}
                                      </p>
                                      <p className={`font-mono font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{(ticketInfo?.price || 0) * qty} ETB</p>
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

                  <div className={`rounded-[32px] p-8 border ${isDarkTheme ? 'bg-bg3 border-gray-600' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkTheme ? 'text-accent' : 'text-accent2'}`}>Amount Due</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-black tracking-tighter italic ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{total}</span>
                      <span className={`text-xs font-black uppercase tracking-widest ${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`}>ETB</span>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={total === 0 || bookingLoading}
                    onClick={handleCheckout}
                    className="w-full mt-8 py-6 bg-accent text-white rounded-[24px] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-yellow-400 transition-all shadow-xl disabled:opacity-20 disabled:grayscale"
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
              className="w-full relative py-6 rounded-[32px] shadow-[0_25px_50px_rgba(0,0,0,0.15)] flex items-center justify-between px-8 overflow-hidden group border border-accent"
            >
              {/* Cinematic Frosted Glass Background */}
              <div className={`absolute inset-0 backdrop-blur-xl transition-colors ${isDarkTheme ? 'bg-gray-800/20 group-hover:bg-gray-700/30' : 'bg-white/20 group-hover:bg-white/30'}`} />
              
              {/* Indigo Shimmer Accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -z-10 ${isDarkTheme ? 'bg-indigo-900/20' : 'bg-indigo-200/40'}`} />

              {/* Text - High Contrast */}
              <div className="relative flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent opacity-90 mb-0.5">Adventure Total</span>
                <span className={`text-2xl font-black italic tracking-tighter ${isDarkTheme ? 'text-white' : 'text-slate-950'}`}>{total} ETB</span>
              </div>
              
              {/* Action Badge */}
              <div className="relative flex items-center gap-2 font-black uppercase text-[10px] tracking-widest bg-accent text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-200 border border-indigo-700/50">
                Summary <ChevronDown size={14} className="animate-bounce" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Adventure Booked!"
        message="Your adventure passes have been confirmed. Get ready for an amazing experience at Bora Park!"
        bookingReference={bookingReference}
        bookingId={bookingId}
        showActions={true}
      />
    </div>
  );
};

export default BuyTicketsPage;