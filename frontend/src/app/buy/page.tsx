"use client";
import React, { useState, useEffect } from "react";
import { Ticket, ShoppingCart, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Game } from "@/types";
import { gameService } from "@/services/adminService";
import { format } from "date-fns";

const gameVisuals = [
  { emoji: "🎢", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop" },
  { emoji: "🎡", image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=600&h=400&fit=crop" },
  { emoji: "🚗", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop" },
  { emoji: "👻", image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=600&h=400&fit=crop" },
  { emoji: "🎠", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop" },
  { emoji: "🎯", image: "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=600&h=400&fit=crop" },
];

const palettes = [
  ['#E8431A', '#FAF0DC', '#FAF0DC'],
  ['#FAF0DC', '#1A1A2E', '#E8431A'],
  ['#1A1A2E', '#F5C842', '#E8431A'],
  ['#F5C842', '#1A1A2E', '#E8431A'],
  ['#2D6A4F', '#FAF0DC', '#F5C842'],
  ['#7B2D8B', '#FAF0DC', '#F5C842'],
  ['#E8431A', '#1A1A2E', '#F5C842'],
  ['#1A1A2E', '#FAF0DC', '#F5C842'],
  ['#F5C842', '#E8431A', '#1A1A2E'],
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

  if (loading && !games) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF0DC' }}>
        <motion.p
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-[#E8431A] font-black text-2xl uppercase tracking-widest"
          style={{ fontFamily: "'Arial Black', sans-serif" }}
        >
          LOADING GAMES…
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF0DC' }}>

      {/* ── RETRO HEADER ── */}
      <div className="relative overflow-hidden pt-20 pb-4" style={{ background: '#1A1A2E' }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          {[520, 420, 320, 220].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: size, height: size,
                borderColor: i % 2 === 0 ? 'rgba(245,200,66,0.12)' : 'rgba(232,67,26,0.12)',
                top: '50%', left: '50%',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 text-center pb-10 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[#F5C842] text-[10px] font-black uppercase tracking-[0.6em] mb-4">
              ✦ Bora Park Amusements ✦
            </p>
            <h1
              className="font-black uppercase leading-none text-[#FAF0DC]"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 7rem)', letterSpacing: '-0.02em' }}
            >
              PICK YOUR
            </h1>
            <div className="flex items-center justify-center gap-4 my-1">
              <div className="h-0.5 flex-1 max-w-32" style={{ background: '#E8431A' }} />
              <p className="text-[#E8431A] font-black text-sm uppercase tracking-[0.4em]">
                {format(new Date(), 'yyyy')}
              </p>
              <div className="h-0.5 flex-1 max-w-32" style={{ background: '#E8431A' }} />
            </div>
            <h1
              className="font-black uppercase leading-none"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 7rem)', letterSpacing: '-0.02em', color: '#F5C842' }}
            >
              ADVENTURES
            </h1>
          </motion.div>
        </div>

        {/* Zigzag border */}
        <svg viewBox="0 0 1200 30" className="w-full" preserveAspectRatio="none" style={{ display: 'block' }}>
          <polyline
            points={Array.from({ length: 61 }, (_, i) => `${i * 20},${i % 2 === 0 ? 30 : 0}`).join(' ')}
            fill="none" stroke="#FAF0DC" strokeWidth="2"
          />
          <polygon
            points={`0,30 ${Array.from({ length: 61 }, (_, i) => `${i * 20},${i % 2 === 0 ? 30 : 0}`).join(' ')} 1200,30`}
            fill="#FAF0DC"
          />
        </svg>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-start">

          {/* Games Grid */}
          <div className="lg:col-span-2">
            {error && (
              <p className="text-[#E8431A] text-sm mb-8 p-4 border-2 border-[#E8431A] font-sans">{error}</p>
            )}

            {!error && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <AnimatePresence>
                  {games?.map((game, index) => {
                    const [bg, text, accent] = palettes[index % palettes.length];
                    const isOpen = openGameId === game.id;
                    const hasItems = !!cart[game.id];
                    const visual = gameVisuals[index % gameVisuals.length];
                    const lowestPrice = game.ticket_types?.length
                      ? Math.min(...game.ticket_types.map((t) => t.price))
                      : null;

                    return (
                      <motion.div
                        key={game.id}
                        variants={{
                          hidden: { opacity: 0, rotate: -1, scale: 0.97 },
                          visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.5 } },
                        }}
                        whileHover={{ scale: 1.02, rotate: index % 2 === 0 ? 0.6 : -0.6, transition: { duration: 0.2 } }}
                      >
                        <div
                          className="group relative cursor-pointer overflow-hidden"
                          style={{ background: bg, border: `3px solid ${text}` }}
                          onClick={() => toggleDrawer(game.id)}
                        >
                          {/* Top bar */}
                          <div
                            className="px-4 py-2 flex items-center justify-between"
                            style={{ background: text, color: accent }}
                          >
                            <span className="font-black text-[10px] uppercase tracking-[0.4em]">ATTRACTION</span>
                            {lowestPrice !== null && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-[10px] uppercase tracking-[0.2em]">from</span>
                                <div
                                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0"
                                  style={{ borderColor: accent }}
                                >
                                  <span className="font-black text-[9px] text-center leading-tight" style={{ color: accent }}>
                                    {lowestPrice}<br />ETB
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ── PICTURE ── */}
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
                                  parent.style.background = bg;
                                  parent.style.display = "flex";
                                  parent.style.alignItems = "center";
                                  parent.style.justifyContent = "center";
                                  parent.innerHTML = `<div style="font-size:5rem">${visual.emoji}</div>`;
                                }
                              }}
                            />
                            {/* Color tint overlay matching card palette */}
                            <div className="absolute inset-0 opacity-25 transition-opacity group-hover:opacity-10" style={{ background: bg }} />
                            {/* Emoji badge */}
                            <div className="absolute top-3 left-3 text-3xl drop-shadow-lg">{visual.emoji}</div>
                            {/* "In cart" badge */}
                            {hasItems && (
                              <div
                                className="absolute bottom-3 right-3 text-[10px] font-black uppercase px-2 py-1"
                                style={{ background: accent, color: text === '#FAF0DC' ? '#1A1A2E' : bg }}
                              >
                                {Object.values(cart[game.id]).reduce((a, b) => a + b, 0)} IN CART
                              </div>
                            )}
                          </div>

                          {/* Label area */}
                          <div className="p-5">
                            <h3
                              className="font-black uppercase leading-tight mb-2"
                              style={{
                                fontFamily: "'Arial Black', sans-serif",
                                fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
                                color: text,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {game.name}
                            </h3>

                            <p
                              className="text-xs leading-relaxed line-clamp-2 mb-4"
                              style={{ color: text, opacity: 0.5, fontFamily: 'sans-serif', fontWeight: 300 }}
                            >
                              {game.description || 'Step right up and experience the thrill!'}
                            </p>

                            <span
                              className="text-[10px] font-black uppercase tracking-[0.3em]"
                              style={{ color: text, opacity: 0.4 }}
                            >
                              {isOpen ? '▼ TAP TO CLOSE' : '► TAP FOR TICKETS'}
                            </span>
                          </div>

                          {/* ── Ticket drawer ── */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="flex items-center overflow-hidden border-t-2 border-dashed" style={{ borderColor: `${text}50` }}>
                                  {Array.from({ length: 20 }, (_, k) => (
                                    <div key={k} className="h-2 flex-1" style={{ background: k % 2 === 0 ? `${text}15` : 'transparent' }} />
                                  ))}
                                </div>

                                <div className="p-5 space-y-2" style={{ background: `${bg}CC` }}>
                                  {game.ticket_types?.map((tt) => {
                                    const qty = cart[game.id]?.[tt.category] || 0;
                                    return (
                                      <div
                                        key={tt.category}
                                        className="flex items-center justify-between p-3"
                                        style={{ background: text === '#FAF0DC' ? '#1A1A2E' : '#FAF0DC', border: `2px solid ${accent}` }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div>
                                          <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: accent }}>
                                            {tt.category}
                                          </span>
                                          <span className="text-sm font-black" style={{ color: text === '#FAF0DC' ? '#FAF0DC' : bg }}>
                                            {tt.price} ETB
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => updateQuantity(game.id, tt.category, -1)}
                                            className="w-8 h-8 flex items-center justify-center font-black text-lg"
                                            style={{ background: accent, color: text === '#FAF0DC' ? '#1A1A2E' : bg }}
                                          >−</button>
                                          <motion.span
                                            key={qty}
                                            initial={{ scale: 1.4 }}
                                            animate={{ scale: 1 }}
                                            className="w-6 text-center font-black text-sm"
                                            style={{ color: text }}
                                          >
                                            {qty}
                                          </motion.span>
                                          <button
                                            onClick={() => updateQuantity(game.id, tt.category, 1)}
                                            className="w-8 h-8 flex items-center justify-center font-black text-lg"
                                            style={{ background: accent, color: text === '#FAF0DC' ? '#1A1A2E' : bg }}
                                          >+</button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Perforated ticket bottom */}
                          <div className="flex items-center overflow-hidden" style={{ borderTop: `2px dashed ${text}30` }}>
                            {Array.from({ length: 24 }, (_, k) => (
                              <div key={k} className="h-3 flex-1" style={{ background: k % 2 === 0 ? `${text}08` : 'transparent' }} />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* ── CHECKOUT SIDEBAR ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="sticky top-20 h-fit"
            style={{ background: '#1A1A2E', border: '4px solid #F5C842' }}
          >
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-black uppercase text-xl tracking-tight"
                  style={{ fontFamily: "'Arial Black', sans-serif", color: '#F5C842' }}
                >
                  YOUR<br />ADVENTURE
                </h2>
                <ShoppingCart className="w-8 h-8" style={{ color: '#F5C842' }} />
              </div>

              <div className="space-y-4 min-h-[200px]">
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed" style={{ borderColor: '#F5C84240' }}>
                    <Ticket className="w-8 h-8 mx-auto mb-2" style={{ color: '#F5C84240' }} />
                    <p className="text-sm font-sans" style={{ color: '#F5C84260' }}>No tickets selected</p>
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
                          className="space-y-1 border-t pt-3 first:border-0 first:pt-0"
                          style={{ borderColor: '#F5C84230' }}
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#E8431A' }}>
                            {game?.name}
                          </p>
                          {Object.entries(selections).map(([category, qty]) => {
                            const ticketInfo = game?.ticket_types?.find((t) => t.category === category);
                            const lineTotal = (ticketInfo?.price || 0) * qty;
                            return (
                              <div key={category} className="flex justify-between items-center text-sm">
                                <div>
                                  <span className="font-bold capitalize" style={{ color: '#FAF0DC' }}>
                                    {qty}× {category}
                                  </span>
                                  <span className="text-[10px] ml-2" style={{ color: '#F5C84280' }}>
                                    @ {ticketInfo?.price} ETB
                                  </span>
                                </div>
                                <span className="font-mono font-bold" style={{ color: '#F5C842' }}>
                                  {lineTotal} ETB
                                </span>
                              </div>
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              <div className="mt-6 pt-4 border-t-2" style={{ borderColor: '#F5C842' }}>
                <div className="flex justify-between items-end">
                  <span className="font-black uppercase text-xs tracking-widest" style={{ color: '#F5C84280' }}>TOTAL</span>
                  <div className="text-right">
                    <span className="text-4xl font-black" style={{ color: '#F5C842' }}>{total}</span>
                    <span className="text-sm font-bold ml-1" style={{ color: '#E8431A' }}>ETB</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                disabled={total === 0}
                className="w-full font-black py-4 text-sm uppercase tracking-widest transition-all disabled:opacity-30"
                style={{
                  background: total === 0 ? '#1A1A2E' : '#E8431A',
                  color: '#FAF0DC',
                  border: '3px solid #F5C842',
                  fontFamily: "'Arial Black', sans-serif",
                }}
              >
                PROCEED TO CHECKOUT →
              </button>

              <div className="mt-6 flex items-center overflow-hidden">
                {Array.from({ length: 20 }, (_, k) => (
                  <div key={k} className="h-2 flex-1" style={{ background: k % 2 === 0 ? '#F5C84230' : 'transparent' }} />
                ))}
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-center mt-2" style={{ color: '#F5C84260' }}>
                ✦ INSTANT QR DELIVERY ✦
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default BuyTicketsPage;