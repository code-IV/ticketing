"use client";
import React, { useState, useEffect } from "react";
import {
  Ticket,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Info,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Game } from "@/types";
import { gameService } from "@/services/adminService";

const BuyTicketsPage = () => {
  const [games, setGames] = useState<Game[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGameId, setOpenGameId] = useState<string | null>(null);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await gameService.getAll();
      // console.log(response);
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

      // Remove category if qty is 0
      if (newQty === 0) delete updatedGameSelection[category];

      // Remove game from cart entirely if no tickets are selected
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

  const gamesPrice = selectedGames.reduce(
    (sum, id) =>
      sum +
      (games
        ?.find((g) => g.id === id)
        ?.ticket_types?.find((t) => t.category === "adult")?.price || 0),
    0,
  );
  // Calculate Grand Total
  const total = Object.entries(cart).reduce(
    (grandTotal, [gameId, selections]) => {
      const game = games?.find((g) => g.id === gameId);
      const gameTotal = Object.entries(selections).reduce((sum, [cat, qty]) => {
        const price =
          game?.ticket_types?.find((t) => t.category === cat)?.price || 0;
        return sum + price * qty;
      }, 0);
      return grandTotal + gameTotal;
    },
    0,
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { scale: 1.04, transition: { duration: 0.25 } },
    selected: {
      scale: 1.03,
      boxShadow: "0 20px 35px -10px rgba(59,130,246,0.4)",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Games */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Pick Your Adventures
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AnimatePresence>
                {games &&
                  games.map((game) => {
                    const isOpen = openGameId === game.id;
                    const hasItems = !!cart[game.id];
                    const isSelected = selectedGames.includes(game.id);
                    return (
                      <motion.div
                        key={game.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => toggleDrawer(game.id)} // Only toggles THIS game
                        className={`group cursor-pointer rounded-[32px] p-6 border-2 transition-all ${
                          isOpen || hasItems
                            ? "border-purple-600 bg-white shadow-xl"
                            : "border-gray-100 bg-white shadow-sm hover:border-purple-200"
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-colors ${
                              hasItems
                                ? "bg-purple-600 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {hasItems ? (
                              <ShoppingCart size={20} />
                            ) : (
                              <Zap size={20} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-gray-900">
                              {game.name}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {isOpen ? "Close options" : "Tap to see tickets"}
                            </p>
                          </div>
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                            <Info
                              size={20}
                              className={
                                isOpen ? "text-purple-600" : "text-gray-300"
                              }
                            />
                          </motion.div>
                        </div>

                        {/* TICKET DRAWER */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pt-6 mt-4 border-t border-slate-50">
                                {game.ticket_types?.map((tt) => {
                                  const qty = cart[game.id]?.[tt.category] || 0;
                                  return (
                                    <div
                                      key={tt.category}
                                      className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl"
                                    >
                                      <div>
                                        <span className="text-[10px] font-black text-purple-600 uppercase block">
                                          {tt.category}
                                        </span>
                                        <span className="text-sm font-bold text-slate-700">
                                          {tt.price} ETB
                                        </span>
                                      </div>

                                      <div
                                        className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl border border-slate-200"
                                        onClick={(e) => e.stopPropagation()} // CRITICAL: Prevents drawer from closing
                                      >
                                        <button
                                          onClick={() =>
                                            updateQuantity(
                                              game.id,
                                              tt.category,
                                              -1,
                                            )
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 font-bold"
                                        >
                                          -
                                        </button>
                                        <span className="w-4 text-center font-black text-slate-800 text-sm">
                                          {qty}
                                        </span>
                                        <button
                                          onClick={() =>
                                            updateQuantity(
                                              game.id,
                                              tt.category,
                                              1,
                                            )
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Sticky Checkout */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-gradient-to-b from-gray-900 to-black text-white p-8 rounded-3xl shadow-2xl h-fit sticky top-8"
        >
          <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-400" /> Your Adventure
          </h2>

          <div className="space-y-6 mb-10">
            {/* If cart is empty */}
            {Object.keys(cart).length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-2xl">
                <Ticket className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No tickets selected</p>
              </div>
            )}

            {/* Map through the cart object */}
            {Object.entries(cart).map(([gameId, selections]) => {
              const game = games?.find((g) => g.id === gameId);

              return (
                <div
                  key={gameId}
                  className="space-y-3 pt-4 border-t border-gray-800 first:border-0 first:pt-0"
                >
                  {/* Game Title */}
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                    {game?.name || "Loading..."}
                  </p>

                  {/* List categories for this game */}
                  {Object.entries(selections).map(([category, qty]) => {
                    const ticketInfo = game?.ticket_types?.find(
                      (t) => t.category === category,
                    );
                    const lineTotal = (ticketInfo?.price || 0) * qty;

                    return (
                      <div
                        key={category}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-gray-200 font-bold capitalize">
                            {qty}x {category}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            @{ticketInfo?.price} ETB
                          </span>
                        </div>
                        <span className="font-mono text-blue-400 font-bold">
                          {lineTotal} <span className="text-[10px]">ETB</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Final Total Section */}
            <div className="pt-6 border-t border-gray-700">
              <div className="flex justify-between items-end">
                <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">
                  Total Amount
                </span>
                <div className="text-right">
                  <span className="text-4xl font-black text-white">
                    {total}
                  </span>
                  <span className="text-sm font-bold ml-1 text-blue-400">
                    ETB
                  </span>
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
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Instant QR Delivery
            </p>
            <div className="h-1 w-1 bg-white rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyTicketsPage;
