"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminService, ticketService } from "@/services/adminService";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const ACCENT = "#FFD84D";

// ── Icons ───────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

interface Ticket {
  id: string;
  bookingReference: string;
  ticketCode: string;
  guestEmail: string;
  guestName: string;
  status: string;
  expiresAt: string;
  passes: {
    productId: string;
    productName: string;
    productType: string;
    usageDetails: {
      passId: string;
      category: string;
      quantity: number;
      usedQuantity: number;
      status: string;
    }[];
  }[];
}

interface TicketItem {
  id: string;
  game_name: string;
  emoji: string;
  ticket_types: {
    id: string;
    category: string;
    purchased: number;
    used: number;
  }[];
}

interface TransactionData {
  transaction_code: string;
  guest_name: string;
  total_amount: number;
  ticket_id: string;
  product_id: string;
}

interface DraftQty {
  [key: string]: number;
}

interface PunchLogEntry {
  game: string;
  emoji: string;
  category: string;
  count: number;
  time: string;
}

// ── HELPERS ────────────────────────────────────────────────────────────────
const totalPurchased = (item: TicketItem) =>
  item.ticket_types.reduce((s, t) => s + t.purchased, 0);
const totalUsed = (item: TicketItem) =>
  item.ticket_types.reduce((s, t) => s + t.used, 0);
const isFullyUsed = (item: TicketItem) =>
  totalUsed(item) >= totalPurchased(item);

// ── PERFORATED STRIP ───────────────────────────────────────────────────────
const Perforation = ({ isDark }: { isDark: boolean }) => (
  <div
    className="flex overflow-hidden"
    style={{
      borderTop: `2px dashed ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
    }}
  >
    {Array.from({ length: 32 }, (_, k) => (
      <div
        key={k}
        className="h-2.5 flex-1"
        style={{
          background:
            k % 2 === 0
              ? isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)"
              : "transparent",
        }}
      />
    ))}
  </div>
);

// ── CONFIRM MODAL ──────────────────────────────────────────────────────────
const ConfirmModal = ({
  punchList,
  onConfirm,
  onCancel,
  punching,
  isDark,
}: {
  punchList: any[];
  onConfirm: () => void;
  onCancel: () => void;
  punching: boolean;
  isDark: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
    style={{ background: isDark ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.5)" }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className={`w-full max-w-sm overflow-hidden rounded-3xl ${
        isDark ? "bg-[#111111]" : "bg-white"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="px-6 py-5"
        style={{ background: isDark ? "#0A0A0A" : "#000" }}
      >
        <p
          className="font-black text-[9px] uppercase tracking-[0.45em] mb-2"
          style={{ color: isDark ? `${ACCENT}45` : `${ACCENT}80` }}
        >
          Confirm Action
        </p>
        <h2 className="font-black uppercase leading-none text-white text-3xl">
          PUNCH
        </h2>
      </div>
      <div
        className={`px-5 py-4 space-y-2 ${
          isDark ? "bg-[#111111]" : "bg-white"
        }`}
      >
        {punchList.map((entry, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
              isDark ? "bg-white/5" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{entry.emoji}</span>
              <span
                className={`font-black text-xs uppercase ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                {entry.game}
              </span>
            </div>
            <span className="font-black text-red-600">×{entry.count}</span>
          </div>
        ))}
      </div>
      <div
        className={`p-4 grid grid-cols-2 gap-3 ${
          isDark
            ? "bg-[#111111] border-t border-white/10"
            : "bg-white border-t border-slate-100"
        }`}
      >
        <button
          onClick={onCancel}
          className={`py-4 font-black uppercase text-xs tracking-widest ${
            isDark ? "text-white/40" : "text-slate-400"
          }`}
        >
          CANCEL
        </button>
        <button
          onClick={onConfirm}
          disabled={punching}
          className="py-4 font-black uppercase text-sm tracking-widest bg-red-600 text-white rounded-xl disabled:opacity-50"
        >
          {punching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            "CONFIRM"
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ── GAME CARD ─────────────────────────────────────────────────────────────
const GameCard = ({
  item,
  index,
  draftQty,
  onQtyChange,
  isExpanded,
  onToggle,
  isDark,
}: {
  item: TicketItem;
  index: number;
  draftQty: DraftQty;
  onQtyChange: (ttId: string, val: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
}) => {
  const purchased = totalPurchased(item);
  const used = totalUsed(item);
  const remaining = purchased - used;
  const pct = purchased === 0 ? 0 : (used / purchased) * 100;
  const full = remaining === 0;

  const handleControlClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-3xl border overflow-hidden cursor-pointer shadow-sm flex flex-col ${
        isDark ? "bg-[#111111] border-white/10" : "bg-white border-slate-100"
      }`}
      onClick={full ? undefined : onToggle}
      style={{ opacity: full ? 0.7 : 1 }}
    >
      {/* 1. Header Section */}
      <div className="p-5 grow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{item.emoji}</span>
            <h3
              className={`font-black text-xl truncate ${
                isDark ? "text-white" : "text-slate-800"
              }`}
            >
              {item.game_name}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {item.ticket_types.map((tt) => (
              <div key={tt.id} className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase ${
                    isDark ? "text-white/30" : "text-slate-400"
                  }`}
                >
                  {tt.category}
                </span>
                <span className="font-black text-sm" style={{ color: ACCENT }}>
                  {tt.purchased - tt.used}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!full && (
          <p
            className={`text-[9px] font-black uppercase tracking-[0.2em] mt-4 ${
              isDark ? "text-white/20" : "text-slate-300"
            }`}
          >
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
            className={isDark ? "bg-white/5" : "bg-slate-50/50"}
          >
            <div className="px-5 pb-5 space-y-3 pt-2">
              {item.ticket_types.map((tt) => {
                const ttRemaining = tt.purchased - tt.used;
                const qty = draftQty[tt.id] ?? 0;
                const setQty = (val: number) =>
                  onQtyChange(tt.id, Math.min(Math.max(0, val), ttRemaining));

                return (
                  <div
                    key={tt.id}
                    className="flex items-center justify-between"
                    onClick={handleControlClick}
                  >
                    <span
                      className={`font-bold text-xs uppercase ${
                        isDark ? "text-white/60" : "text-slate-600"
                      }`}
                    >
                      {tt.category}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQty(qty - 1)}
                        disabled={qty === 0}
                        className={`w-8 h-8 rounded-lg border font-bold disabled:opacity-30 ${
                          isDark
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        −
                      </button>
                      <span
                        className={`w-4 text-center font-black text-sm ${
                          isDark ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        disabled={qty >= ttRemaining}
                        className={`w-8 h-8 rounded-lg border font-bold disabled:opacity-30 ${
                          isDark
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-white border-slate-200 text-slate-800"
                        }`}
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

      {/* 3. Bottom Progress Section */}
      <div className="mt-auto">
        <Perforation isDark={isDark} />
        <div className="px-5 pb-4 pt-2">
          <div className="flex justify-between items-center mb-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-tighter ${
                isDark ? "text-white/30" : "text-slate-400"
              }`}
            >
              Used: {used} / {purchased}
            </span>
            {full && (
              <span className="text-[9px] font-black text-emerald-500 uppercase">
                Completed
              </span>
            )}
          </div>
          <div
            className={`w-full h-1.5 rounded-full overflow-hidden ${
              isDark ? "bg-white/10" : "bg-slate-100"
            }`}
          >
            <motion.div
              className="h-full"
              style={{ background: full ? "#10B981" : ACCENT }}
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
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isDarkTheme } = useTheme();
  const { user } = useAuth();

  const [items, setItems] = useState<TicketItem[]>([]);
  const [ticketData, setTicketData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState<DraftQty>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [punching, setPunching] = useState(false);
  const [punchLog, setPunchLog] = useState<PunchLogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Check if user has permission to expand cards
  const canExpandCards =
    user?.permissions?.some(
      (role) => role === "SUPERADMIN" || role === "ADMIN" || role === "STAFF",
    ) || false; // Default to false if permissions is undefined

  useEffect(() => {
    if (token) {
      getTicket(token);
    }
  }, [token]);

  const transformTicketData = (
    apiResponse: any,
  ): { items: TicketItem[]; transaction: TransactionData } => {
    if (!apiResponse?.data?.ticket)
      return {
        items: [],
        transaction: {
          transaction_code: "",
          guest_name: "",
          total_amount: 0,
          ticket_id: "",
          product_id: "",
        },
      };

    const ticket = apiResponse.data.ticket;
    console.log("ticket", ticket.passes);

    const transformedItems: TicketItem[] = ticket.passes.map((pass: any) => ({
      id: pass.productId,
      game_name: pass.productName,
      emoji: getGameEmoji(pass.productName),
      ticket_types: pass.usageDetails.map((detail: any) => ({
        id: detail.passId,
        category: detail.category,
        purchased: detail.quantity,
        used: detail.usedQuantity,
      })),
    }));

    const transaction: TransactionData = {
      transaction_code: ticket.bookingReference,
      guest_name: ticket.guestName,
      total_amount: 0,
      ticket_id: ticket.id,
      product_id: "",
    };

    return { items: transformedItems, transaction };
  };

  const getGameEmoji = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes("archery")) return "🏹";
    if (name.includes("maze")) return "🌀";
    if (name.includes("coaster") || name.includes("ride")) return "🎢";
    if (name.includes("house") || name.includes("haunted")) return "👻";
    if (name.includes("wheel") || name.includes("ferris")) return "🎡";
    if (name.includes("bumper") || name.includes("car")) return "🚗";
    if (name.includes("water") || name.includes("splash")) return "💦";
    return "🎮";
  };

  const getTicket = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.scanTicket(token);

      if (response.success && response.data) {
        const transformedData = transformTicketData(response);
        setItems(transformedData.items);
        setTicketData(transformedData.transaction);
      } else {
        setError("Invalid or expired ticket");
      }
    } catch (err) {
      console.error("Error scanning ticket:", err);
      setError("Failed to scan ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const allPunched = items.every(isFullyUsed);
  const anyUsed = items.some((i) => totalUsed(i) > 0);

  const getStatusConfig = () => {
    if (allPunched) return { label: "FULLY USED", bg: "#ef4444" };
    if (anyUsed) return { label: "PARTIALLY USED", bg: "#f97316" };
    return { label: "ACTIVE", bg: "#22c55e" };
  };

  const statusCfg = getStatusConfig();

  const punchList = [];
  for (const item of items) {
    for (const tt of item.ticket_types) {
      const qty = draftQty[tt.id] || 0;
      if (qty > 0) {
        punchList.push({
          itemId: item.id,
          ttId: tt.id,
          game: item.game_name,
          emoji: item.emoji,
          category: tt.category,
          count: qty,
        });
      }
    }
  }

  const handleQtyChange = (ttId: string, val: number) => {
    setDraftQty((prev) => {
      if (val === 0) {
        const { [ttId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ttId]: val };
    });
  };

  const handleConfirm = async () => {
    setPunching(true);

    try {
      // Transform punchList to required array format
      const usage = punchList.map((item) => ({
        passId: item.ttId,
        quantity: item.count,
      }));

      // Call the punch API with the correct format
      const result = await ticketService.punchTicket(usage);

      if (result.success) {
        // Update local state for successful punches
        const log: PunchLogEntry[] = [];
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            ticket_types: item.ticket_types.map((tt) => {
              const qty = draftQty[tt.id] || 0;
              if (qty === 0) return tt;
              log.push({
                game: item.game_name,
                emoji: item.emoji,
                category: tt.category,
                count: qty,
                time: new Date().toLocaleTimeString(),
              });
              return { ...tt, used: tt.used + qty };
            }),
          })),
        );

        setPunchLog((prev) => [...log, ...prev]);
        setDraftQty({});
        setPunching(false);
        setShowConfirm(false);
      } else {
        console.error("Punch failed:", result);
        setPunching(false);
        // You might want to show an error message to user here
      }
    } catch (error) {
      console.error("Error punching tickets:", error);
      setPunching(false);
      // You might want to show an error message to user here
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"
      }`}
    >
      {/* Background decorative elements */}
      <div className="fixed inset-0 flex justify-between items-start pointer-events-none">
        <div
          className="w-64 h-64 rounded-full opacity-5 ml-10 mt-20"
          style={{
            background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)`,
          }}
        />
        <div
          className="w-96 h-96 rounded-full opacity-5 mr-10 mb-20 self-end"
          style={{
            background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto py-8 px-4">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className={`flex items-center gap-2 transition-colors mb-8 ${
            isDarkTheme
              ? "text-white/60 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Home</span>
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div>
              <h1
                className={`text-3xl font-black ${
                  isDarkTheme ? "text-white" : "text-slate-900"
                }`}
              >
                Transaction <span style={{ color: ACCENT }}>Details</span>
              </h1>
              <p
                className={`text-sm mt-1 ${
                  isDarkTheme ? "text-white/40" : "text-slate-500"
                }`}
              >
                Token: <span className="font-mono">{token || "Unknown"}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div
              className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase shadow-sm ${
                isDarkTheme
                  ? "bg-[#111111] border-white/10 text-white"
                  : "bg-white border-slate-100 text-slate-900"
              }`}
            >
              Total: {ticketData?.total_amount || 0} ETB
            </div>
            <div
              className="px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-sm text-white"
              style={{ background: statusCfg.bg }}
            >
              {statusCfg.label}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin mb-4"
              style={{ borderColor: `${ACCENT}20`, borderTopColor: ACCENT }}
            />
            <p
              className={`font-medium ${
                isDarkTheme ? "text-white/60" : "text-slate-500"
              }`}
            >
              Scanning ticket...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            className={`rounded-2xl p-8 text-center border ${
              isDarkTheme
                ? "bg-red-900/20 border-red-500/30"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkTheme ? "bg-red-900/30" : "bg-red-100"
              }`}
            >
              <span className="text-2xl">❌</span>
            </div>
            <h3
              className={`text-lg font-black mb-2 ${
                isDarkTheme ? "text-red-400" : "text-red-900"
              }`}
            >
              Ticket Scan Failed
            </h3>
            <p
              className={
                isDarkTheme ? "text-red-300/70 mb-4" : "text-red-700 mb-4"
              }
            >
              {error}
            </p>
            <button
              onClick={() => getTicket(token)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-sm uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success State */}
        {!loading && !error && items.length > 0 && (
          <>
            {/* Transaction Info */}
            <div
              className={`rounded-2xl p-6 border mb-8 ${
                isDarkTheme
                  ? "bg-[#111111] border-white/10"
                  : "bg-white border-slate-100"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p
                    className={`text-[10px] font-black uppercase mb-1 ${
                      isDarkTheme ? "text-white/30" : "text-slate-400"
                    }`}
                  >
                    Booking Reference
                  </p>
                  <p
                    className={`font-mono text-sm font-bold ${
                      isDarkTheme ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {ticketData?.transaction_code || "N/A"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase mb-1 ${
                      isDarkTheme ? "text-white/30" : "text-slate-400"
                    }`}
                  >
                    Guest Name
                  </p>
                  <p
                    className={`font-mono text-sm font-bold ${
                      isDarkTheme ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {ticketData?.guest_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-[10px] font-black uppercase mb-1 ${
                      isDarkTheme ? "text-white/30" : "text-slate-400"
                    }`}
                  >
                    Total Amount
                  </p>
                  <p
                    className={`font-mono text-sm font-bold ${
                      isDarkTheme ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {ticketData?.total_amount || 0} ETB
                  </p>
                </div>
              </div>
            </div>

            {/* Game Cards */}
            <div className="flex flex-wrap -mx-2 -my-2 items-start">
              {items.map((item, i) => (
                <div key={item.id} className="w-full sm:w-1/2 lg:w-1/3 p-2">
                  <GameCard
                    item={item}
                    index={i}
                    draftQty={draftQty}
                    onQtyChange={handleQtyChange}
                    isExpanded={
                      expandedId === item.id && Boolean(canExpandCards)
                    }
                    onToggle={() =>
                      Boolean(canExpandCards) &&
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    isDark={isDarkTheme}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Data State */}
        {!loading && !error && items.length === 0 && (
          <div
            className={`rounded-2xl p-8 text-center border ${
              isDarkTheme
                ? "bg-white/5 border-white/10"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkTheme ? "bg-white/10" : "bg-slate-100"
              }`}
            >
              <span className="text-2xl">🎫</span>
            </div>
            <h3
              className={`text-lg font-black mb-2 ${
                isDarkTheme ? "text-white" : "text-slate-900"
              }`}
            >
              No Ticket Data
            </h3>
            <p className={isDarkTheme ? "text-white/40" : "text-slate-600"}>
              This ticket doesn't contain any redeemable passes.
            </p>
          </div>
        )}

        {/* LOG SECTION */}
        <AnimatePresence>
          {punchLog.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-12 rounded-3xl p-6 border ${
                isDarkTheme
                  ? "bg-[#111111] border-white/10"
                  : "bg-white border-slate-100"
              }`}
            >
              <p
                className={`font-black text-xs uppercase mb-4 tracking-widest ${
                  isDarkTheme ? "text-white/30" : "text-slate-400"
                }`}
              >
                Recent Activity
              </p>
              <div className="space-y-3">
                {punchLog.slice(0, 5).map((log, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center text-sm border-b pb-2 ${
                      isDarkTheme
                        ? "border-white/5 text-white/70"
                        : "border-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-bold">
                      {log.emoji} {log.count}× {log.game}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isDarkTheme ? "text-white/30" : "text-slate-400"
                      }`}
                    >
                      {log.time}
                    </span>
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
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md border-t z-50 ${
              isDarkTheme
                ? "bg-[#111111]/80 border-white/10"
                : "bg-white/80 border-t"
            }`}
          >
            <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
              <p
                className="font-black text-xs uppercase truncate"
                style={{ color: ACCENT }}
              >
                {punchList.length} items selected
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                style={{
                  boxShadow: isDarkTheme
                    ? "0 10px 25px -5px rgba(239,68,68,0.3)"
                    : "0 10px 25px -5px rgba(239,68,68,0.2)",
                }}
              >
                PUNCH TICKETS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            punchList={punchList}
            onConfirm={handleConfirm}
            onCancel={() => !punching && setShowConfirm(false)}
            punching={punching}
            isDark={isDarkTheme}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${ACCENT};
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
