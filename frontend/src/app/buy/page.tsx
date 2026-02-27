"use client";
import React, { useState, useEffect } from "react";
import { Ticket, ShoppingCart, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Game } from "@/types";
import { gameService } from "@/services/adminService";

const gameVisuals = [
  { emoji: "🎢", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop" },
  { emoji: "🎡", image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=600&h=400&fit=crop" },
  { emoji: "🚗", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop" },
  { emoji: "👻", image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=600&h=400&fit=crop" },
  { emoji: "🎠", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop" },
  { emoji: "🎯", image: "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=600&h=400&fit=crop" },
];

const BuyTicketsPage = () => {
  const [games, setGames] = useState<Game[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGameId, setOpenGameId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => { loadGames(); }, []);

  const loadGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await gameService.getAll();
      setGames(response.data || []);
    } catch (error) {
      console.error("Failed to load games:", error);
      setError("Failed to load games. Please try again.");
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

  const toggleDrawer = (id: string) => {
    setOpenGameId(openGameId === id ? null : id);
  };

  const total = Object.entries(cart).reduce((grandTotal, [gameId, selections]) => {
    const game = games?.find((g) => g.id === gameId);
    const gameTotal = Object.entries(selections).reduce((sum, [cat, qty]) => {
      const price = game?.ticket_types?.find((t) => t.category === cat)?.price || 0;
      return sum + price * qty;
    }, 0);
    return grandTotal + gameTotal;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Heading ABOVE the grid ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Pick Your Adventures
          </h2>
        </div>

        {/* ── Grid: cards + checkout side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-start">

          {/* Cards */}
          <div className="lg:col-span-2">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Loading games…</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
                {error}
              </div>
            )}

            {/* Games grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AnimatePresence>
                  {games?.map((game, index) => {
                    const isOpen = openGameId === game.id;
                    const hasItems = !!cart[game.id];
                    const visual = gameVisuals[index % gameVisuals.length];
                    const lowestPrice = game.ticket_types?.length
                      ? Math.min(...game.ticket_types.map((t) => t.price))
                      : null;

                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        onClick={() => toggleDrawer(game.id)}
                        className={`group cursor-pointer rounded-3xl overflow-hidden border-2 transition-all shadow-md ${
                          isOpen || hasItems
                            ? "border-purple-600 shadow-purple-200 shadow-xl"
                            : "border-transparent bg-white hover:shadow-xl"
                        }`}
                      >
                        {/* Picture */}
                        <div className="relative w-full h-44 overflow-hidden">
                          <img
                            src={visual.image}
                            alt={game.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.style.background = "linear-gradient(135deg, #a855f7, #ec4899)";
                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-6xl">${visual.emoji}</div>`;
                              }
                            }}
                          />
                          {hasItems && (
                            <div className="absolute inset-0 bg-purple-600/20 flex items-end p-3">
                              <span className="bg-purple-600 text-white text-xs font-black px-2 py-1 rounded-full">
                                {Object.values(cart[game.id]).reduce((a, b) => a + b, 0)} in cart
                              </span>
                            </div>
                          )}
                          {lowestPrice !== null && (
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-purple-700 font-extrabold text-xs px-3 py-1 rounded-full shadow">
                              from {lowestPrice} ETB
                            </div>
                          )}
                        </div>

                        {/* Label */}
                        <div className={`p-4 transition-colors ${isOpen || hasItems ? "bg-gradient-to-br from-purple-50 to-pink-50" : "bg-white"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg shrink-0">{visual.emoji}</span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">
                                  {game.name}
                                </h4>
                                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-0.5">
                                  {isOpen ? "Tap to close" : "Tap to select"}
                                </p>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.25 }}
                              className="shrink-0"
                            >
                              <Zap size={16} className={isOpen ? "text-purple-500" : "text-gray-300"} />
                            </motion.div>
                          </div>

                          {/* Ticket drawer */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 pt-4 mt-3 border-t border-purple-100">
                                  {game.ticket_types?.map((tt) => {
                                    const qty = cart[game.id]?.[tt.category] || 0;
                                    return (
                                      <div
                                        key={tt.category}
                                        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-purple-100 shadow-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div>
                                          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">
                                            {tt.category}
                                          </span>
                                          <span className="text-sm font-bold text-gray-800">
                                            {tt.price} ETB
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                                          <button
                                            onClick={() => updateQuantity(game.id, tt.category, -1)}
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 font-black text-lg leading-none"
                                          >−</button>
                                          <motion.span
                                            key={qty}
                                            initial={{ scale: 1.4, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-5 text-center font-black text-slate-800 text-sm"
                                          >
                                            {qty}
                                          </motion.span>
                                          <button
                                            onClick={() => updateQuantity(game.id, tt.category, 1)}
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-purple-600 font-black text-lg leading-none"
                                          >+</button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
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

          {/* ── Checkout (now starts at same level as cards) ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-gradient-to-b from-gray-900 to-black text-white p-8 rounded-3xl shadow-2xl h-fit sticky top-20"
          >
            <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-blue-400" /> Your Adventure
            </h2>

            <div className="space-y-6 mb-10">
              {Object.keys(cart).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-2xl">
                  <Ticket className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No tickets selected</p>
                </div>
              ) : (
                <AnimatePresence>
                  {Object.entries(cart).map(([gameId, selections]) => {
                    const game = games?.find((g) => g.id === gameId);
                    return (
                      <motion.div
                        key={gameId}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2 pt-4 border-t border-gray-800 first:border-0 first:pt-0"
                      >
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                          {game?.name || "Loading…"}
                        </p>
                        {Object.entries(selections).map(([category, qty]) => {
                          const ticketInfo = game?.ticket_types?.find((t) => t.category === category);
                          const lineTotal = (ticketInfo?.price || 0) * qty;
                          return (
                            <div key={category} className="flex justify-between items-center text-sm">
                              <div className="flex flex-col">
                                <span className="text-gray-200 font-bold capitalize">{qty}× {category}</span>
                                <span className="text-[10px] text-gray-500">@ {ticketInfo?.price} ETB</span>
                              </div>
                              <span className="font-mono text-blue-400 font-bold">
                                {lineTotal} <span className="text-[10px]">ETB</span>
                              </span>
                            </div>
                          );
                        })}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

              <div className="pt-6 border-t border-gray-700">
                <div className="flex justify-between items-end">
                  <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Total Amount</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-white">{total}</span>
                    <span className="text-sm font-bold ml-1 text-blue-400">ETB</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={total === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/20"
            >
              PROCEED TO CHECKOUT
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
              <div className="h-1 w-1 bg-white rounded-full" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Instant QR Delivery</p>
              <div className="h-1 w-1 bg-white rounded-full" />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default BuyTicketsPage;