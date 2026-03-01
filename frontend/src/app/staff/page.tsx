"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── GENERIC COLOR PALETTE ─────────────────────────────────────────────────
const colors = {
  white: "#FFFFFF",
  black: "#000000",
  grey: "#808080",
  blue: "#0000FF",
  red: "#FF0000",
};

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_TRANSACTION = {
  transaction_code: "BRK-2024-X7K2",
  guest_name: "John Doe",
  total_amount: 780,
};

const MOCK_ITEMS = [
  {
    id: "item-1",
    game_name: "Bumper Ride",
    emoji: "🚗",
    ticket_types: [
      { id: "tt-1a", category: "adult",  purchased: 2, used: 1 },
      { id: "tt-1b", category: "child",  purchased: 4, used: 0 },
    ],
  },
  {
    id: "item-2",
    game_name: "Haunted House",
    emoji: "👻",
    ticket_types: [
      { id: "tt-2a", category: "adult",  purchased: 3, used: 0 },
    ],
  },
  {
    id: "item-3",
    game_name: "Ferris Wheel",
    emoji: "🎡",
    ticket_types: [
      { id: "tt-3a", category: "adult",  purchased: 2, used: 2 },
      { id: "tt-3b", category: "child",  purchased: 2, used: 2 },
      { id: "tt-3c", category: "senior", purchased: 1, used: 1 },
    ],
  },
  {
    id: "item-4",
    game_name: "Roller Coaster",
    emoji: "🎢",
    ticket_types: [
      { id: "tt-4a", category: "adult",  purchased: 4, used: 1 },
      { id: "tt-4b", category: "student",purchased: 2, used: 0 },
    ],
  },
];

const statusConfig = {
  ACTIVE:         { label: "ACTIVE",         bg: colors.blue, color: colors.white },
  PARTIALLY_USED: { label: "PARTIALLY USED", bg: colors.red,  color: colors.white },
  FULLY_USED:     { label: "ALL PUNCHED",    bg: colors.black, color: colors.white },
};

// ── HELPERS ────────────────────────────────────────────────────────────────
const totalPurchased = (item) => item.ticket_types.reduce((s, t) => s + t.purchased, 0);
const totalUsed      = (item) => item.ticket_types.reduce((s, t) => s + t.used, 0);
const isFullyUsed    = (item) => totalUsed(item) >= totalPurchased(item);

// ── PERFORATED STRIP ───────────────────────────────────────────────────────
const Perforation = ({ color }) => (
  <div className="flex overflow-hidden" style={{ borderTop: `2px dashed ${color}25` }}>
    {Array.from({ length: 32 }, (_, k) => (
      <div key={k} className="h-2.5 flex-1"
        style={{ background: k % 2 === 0 ? `${color}07` : "transparent" }} />
    ))}
  </div>
);

// ── CONFIRM MODAL ──────────────────────────────────────────────────────────
const ConfirmModal = ({ punchList, onConfirm, onCancel, punching }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
    style={{ background: `${colors.black}e6`, backdropFilter: "blur(6px)" }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="w-full max-w-sm overflow-hidden rounded-[24px]"
      style={{ background: colors.white }}
      onClick={e => e.stopPropagation()}
    >
      <div className="px-6 py-5" style={{ background: colors.black }}>
        <p className="font-black text-[9px] uppercase tracking-[0.45em] mb-2" style={{ color: `${colors.blue}45` }}>Confirm Action</p>
        <h2 className="font-black uppercase leading-none text-white text-3xl">PUNCH</h2>
      </div>
      <div className="px-5 py-4 space-y-2">
        {punchList.map((entry, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2">
              <span>{entry.emoji}</span>
              <span className="font-black text-xs uppercase">{entry.game}</span>
            </div>
            <span className="font-black text-red-600">×{entry.count}</span>
          </div>
        ))}
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="py-4 font-black uppercase text-xs tracking-widest text-slate-400">CANCEL</button>
        <button onClick={onConfirm} disabled={punching} className="py-4 font-black uppercase text-sm tracking-widest bg-red-600 text-white rounded-xl">
          {punching ? "..." : "CONFIRM"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ── GAME CARD ─────────────────────────────────────────────────────────────
const GameCard = ({ item, index, draftQty, onQtyChange, isExpanded, onToggle }) => {
  const accent = "#4F46E5"; 
  const purchased = totalPurchased(item);
  const used      = totalUsed(item);
  const remaining = purchased - used;
  const pct       = purchased === 0 ? 0 : (used / purchased) * 100;
  const full      = remaining === 0;

  const handleControlClick = (e) => e.stopPropagation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[24px] border border-slate-100 overflow-hidden cursor-pointer shadow-sm flex flex-col"
      onClick={full ? undefined : onToggle}
      style={{ opacity: full ? 0.7 : 1 }}
    >
      {/* 1. Header Section */}
      <div className="p-5 flex-grow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{item.emoji}</span>
            <h3 className="font-black text-xl text-slate-800 truncate">{item.game_name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {item.ticket_types.map(tt => (
              <div key={tt.id} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{tt.category}</span>
                <span className="font-black text-sm text-indigo-600">{tt.purchased - tt.used}</span>
              </div>
            ))}
          </div>
        </div>

        {!full && (
          <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-4 text-slate-300">
            {isExpanded ? "Collapse ▲" : "Tap to adjust ▼"}
          </p>
        )}
      </div>

      {/* 2. Expanded Controls Section */}
      <AnimatePresence>
        {isExpanded && !full && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50/50"
          >
             <div className="px-5 pb-5 space-y-3 pt-2">
              {item.ticket_types.map(tt => {
                const ttRemaining = tt.purchased - tt.used;
                const qty = draftQty[tt.id] ?? 0;
                const setQty = (val) => onQtyChange(tt.id, Math.min(Math.max(0, val), ttRemaining));

                return (
                  <div key={tt.id} className="flex items-center justify-between" onClick={handleControlClick}>
                    <span className="font-bold text-xs text-slate-600 uppercase">{tt.category}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(qty - 1)} disabled={qty === 0} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-30">−</button>
                      <span className="w-4 text-center font-black text-slate-800 text-sm">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} disabled={qty >= ttRemaining} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-30">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Bottom Progress Section (Always at the very bottom) */}
      <div className="mt-auto">
        <Perforation color="#CBD5E1" />
        <div className="px-5 pb-4 pt-2">
          <div className="flex justify-between items-center mb-1.5">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Used: {used} / {purchased}
            </span>
            {full && <span className="text-[9px] font-black text-emerald-500 uppercase">Completed</span>}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{ background: full ? "#10B981" : accent }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "circOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function StaffTransactionPage() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [draftQty, setDraftQty] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [punching, setPunching] = useState(false);
  const [punchLog, setPunchLog] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const allPunched = items.every(isFullyUsed);
  const anyUsed = items.some(i => totalUsed(i) > 0);
  const status = allPunched ? "FULLY_USED" : anyUsed ? "PARTIALLY_USED" : "ACTIVE";
  const statusCfg = statusConfig[status];

  const punchList = [];
  for (const item of items) {
    for (const tt of item.ticket_types) {
      const qty = draftQty[tt.id] || 0;
      if (qty > 0) {
        punchList.push({ itemId: item.id, ttId: tt.id, game: item.game_name, emoji: item.emoji, category: tt.category, count: qty });
      }
    }
  }

  const handleQtyChange = (ttId, val) => {
    setDraftQty(prev => val === 0 ? (({ [ttId]: _, ...rest }) => rest)(prev) : { ...prev, [ttId]: val });
  };

  const handleConfirm = () => {
    setPunching(true);
    setTimeout(() => {
      const log = [];
      setItems(prev => prev.map(item => ({
        ...item,
        ticket_types: item.ticket_types.map(tt => {
          const qty = draftQty[tt.id] || 0;
          if (qty === 0) return tt;
          log.push({ game: item.game_name, emoji: item.emoji, category: tt.category, count: qty, time: new Date().toLocaleTimeString() });
          return { ...tt, used: tt.used + qty };
        }),
      })));
      setPunchLog(prev => [...log, ...prev]);
      setDraftQty({});
      setPunching(false);
      setShowConfirm(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Transaction <span className="text-indigo-600">Details</span></h1>
            <p className="text-slate-500 text-sm mt-1">Ref: <span className="font-mono">{MOCK_TRANSACTION.transaction_code}</span></p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 font-black text-[10px] uppercase shadow-sm">Total: {MOCK_TRANSACTION.total_amount} ETB</div>
            <div className="px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-sm text-white" style={{ background: statusCfg.bg }}>{statusCfg.label}</div>
          </div>
        </div>

        {/* Independent Cards Layout */}
        <div className="flex flex-wrap -mx-2 -my-2 items-start">
          {items.map((item, i) => (
            <div key={item.id} className="w-full sm:w-1/2 lg:w-1/3 p-2">
              <GameCard
                item={item}
                index={i}
                draftQty={draftQty}
                onQtyChange={handleQtyChange}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            </div>
          ))}
        </div>

        {/* LOG SECTION */}
        <AnimatePresence>
          {punchLog.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 bg-white rounded-3xl p-6 border border-slate-100">
              <p className="font-black text-xs text-slate-400 uppercase mb-4 tracking-widest">Recent Activity</p>
              <div className="space-y-3">
                {punchLog.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                    <span className="font-bold text-slate-700">{log.emoji} {log.count}× {log.game}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER ACTION */}
      <AnimatePresence>
        {punchList.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t z-50">
            <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
              <p className="font-black text-xs uppercase text-indigo-600 truncate">{punchList.length} items selected</p>
              <button onClick={() => setShowConfirm(true)} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-transform">
                PUNCH TICKETS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && <ConfirmModal punchList={punchList} onConfirm={handleConfirm} onCancel={() => !punching && setShowConfirm(false)} punching={punching} />}
      </AnimatePresence>
    </div>
  );
}