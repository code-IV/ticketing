"use client";
import React, { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle2, Zap, Plus, Minus, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Game {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at?: string;
  ticket_types?: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    is_active: boolean;
  }>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  hover: { y: -6, transition: { duration: 0.2 } },
};

// Fallback emojis and images per index since backend doesn't return them
const gameVisuals = [
  { emoji: "🎢", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop" },
  { emoji: "🎡", image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400&h=250&fit=crop" },
  { emoji: "🚗", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=250&fit=crop" },
  { emoji: "👻", image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&h=250&fit=crop" },
  { emoji: "🎠", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop" },
  { emoji: "🎯", image: "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=400&h=250&fit=crop" },
];

const BuyTicketsPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // Fetch open games from backend
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/buy/games", { credentials: "include" });
        if (!res.ok) throw new Error(`Failed to load games (${res.status})`);
        const data = await res.json();
        setGames(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load games");
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameId)) {
        setQuantities((q) => {
          const next = { ...q };
          delete next[gameId];
          return next;
        });
        return prev.filter((id) => id !== gameId);
      } else {
        setQuantities((q) => ({ ...q, [gameId]: 1 }));
        return [...prev, gameId];
      }
    });
  };

  const updateQuantity = (gameId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [gameId]: Math.max(1, (prev[gameId] || 1) + delta),
    }));
  };

  // Purchase: one POST per selected game
  const handlePurchase = async () => {
    if (selectedGames.length === 0) return;
    setPurchasing(true);
    setPurchaseError(null);
    setPurchaseSuccess(null);

    try {
      const results = await Promise.all(
        selectedGames.map((game_id) =>
          fetch("/api/buy/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              game_id,
              quantity: quantities[game_id] || 1,
            }),
          }).then(async (res) => {
            const json = await res.json();
            if (!res.ok || !json.success) {
              throw new Error(json.message || `Purchase failed for game ${game_id}`);
            }
            return json;
          })
        )
      );

      const codes = results
        .map((r) => r.data?.ticket?.ticket_code)
        .filter(Boolean)
        .join(", ");

      setPurchaseSuccess(`Purchase successful! Ticket code(s): ${codes}`);
      setSelectedGames([]);
      setQuantities({});
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const total = selectedGames.reduce((sum, id) => {
    const game = games.find((g) => g.id === id);
    const price = game?.ticket_types?.[0]?.price || 0;
    return sum + price * (quantities[id] || 1);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Pick Your Adventures
              </h2>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
                <p>Loading games...</p>
              </div>
            )}

            {/* Fetch error */}
            {error && !loading && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Games grid */}
            {!loading && !error && (
              <>
                {games.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-lg font-medium">No open games available right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {games.map((game, index) => {
                        const isSelected = selectedGames.includes(game.id);
                        const visual = gameVisuals[index % gameVisuals.length];
                        return (
                          <motion.div
                            key={game.id}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleGame(game.id)}
                            onKeyDown={(e) => e.key === "Enter" && toggleGame(game.id)}
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={isSelected}
                            className={`group cursor-pointer rounded-3xl overflow-hidden border-2 transition-all shadow-md ${
                              isSelected
                                ? "border-purple-600 shadow-purple-200 shadow-xl"
                                : "border-transparent bg-white hover:shadow-xl"
                            }`}
                          >
                            {/* Image */}
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

                              {isSelected && (
                                <motion.div
                                  className="absolute inset-0 bg-purple-600/30 flex items-center justify-center"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <motion.div
                                    className="bg-white rounded-full p-2 shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <CheckCircle2 className="w-8 h-8 text-purple-600" />
                                  </motion.div>
                                </motion.div>
                              )}

                              {game.ticket_types?.[0]?.price && (
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-purple-700 font-extrabold text-sm px-3 py-1 rounded-full shadow">
                                  {game.ticket_types[0].price} ETB
                                </div>
                              )}
                            </div>

                            {/* Label */}
                            <div
                              className={`p-4 transition-colors ${
                                isSelected ? "bg-gradient-to-br from-purple-50 to-pink-50" : "bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{visual.emoji}</span>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-base leading-tight">
                                    {game.name}
                                  </h4>
                                  <p className="text-gray-500 text-xs mt-0.5">{game.description}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
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
            <ShoppingCart className="w-6 h-6" /> Your Adventure
          </h2>

          <div className="space-y-4 mb-10">
            {selectedGames.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No rides selected yet.</p>
            ) : (
              <AnimatePresence>
                {selectedGames.map((id) => {
                  const game = games.find((g) => g.id === id);
                  const visual = gameVisuals[games.findIndex((g) => g.id === id) % gameVisuals.length];
                  const qty = quantities[id] || 1;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }}
                      className="bg-white/5 rounded-2xl p-4 space-y-3"
                    >
                      {/* Game name + subtotal */}
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 font-semibold text-sm">
                          <span>{visual.emoji}</span>
                          {game?.name}
                        </span>
                        <span className="text-purple-300 font-bold text-sm">
                          {(game?.ticket_types?.[0]?.price || 0) * qty} ETB
                        </span>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">Tickets:</span>
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-2 py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(id, -1); }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-gray-300 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <motion.span
                            key={qty}
                            initial={{ scale: 1.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-6 text-center font-bold text-white text-sm"
                          >
                            {qty}
                          </motion.span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(id, 1); }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-gray-300 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-gray-500 text-xs">× {game?.ticket_types?.[0]?.price} ETB</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-gray-700 text-3xl font-black">
              <span>Total</span>
              <span className="text-blue-400">{total} ETB</span>
            </div>
          </div>

          {/* Purchase feedback */}
          <AnimatePresence>
            {purchaseError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 mb-4 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {purchaseError}
              </motion.div>
            )}
            {purchaseSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-green-500/20 border border-green-500/40 text-green-300 rounded-xl px-4 py-3 mb-4 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                {purchaseSuccess}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={total === 0 || purchasing}
            onClick={handlePurchase}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
          >
            {purchasing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
              </span>
            ) : (
              "Proceed to Payment"
            )}
          </button>

          <p className="text-xs text-gray-500 mt-6 text-center font-semibold uppercase tracking-widest">
            QR code tickets → sent instantly to email
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default BuyTicketsPage;