"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { bookingService } from "@/services/bookingService";
import { guestCookieUtils } from "@/utils/cookies";
import { Bookings } from "@/types";
import { Button } from "@/components/ui/Button";
import { Calendar, Gamepad2, ChevronDown, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { CiFilter } from "react-icons/ci";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface PassDetails {
  productName: string;
  totalQuantity: number;
  usedQuantity: number;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDarkTheme } = useTheme();
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "EVENT" | "GAME">("ALL");
  const [usageFilter, setUsageFilter] = useState<
    "ALL" | "Available" | "Fully Used" | "Pending" | "Cancelled" | "Refunded"
  >("ALL");
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Guest-only state variables
  const [cookieBookings, setCookieBookings] = useState<Bookings[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadBookings(); // Existing user functionality - NO CHANGES
      } else {
        // Load guest bookings from cookies
        const savedBookings = guestCookieUtils.getGuestBookings();
        setCookieBookings(savedBookings);
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, usageFilter, user]);

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

  // Guest-only function to remove booking from cookies
  const handleRemoveBooking = (bookingId: string) => {
    guestCookieUtils.removeGuestBooking(bookingId);
    const updatedBookings = guestCookieUtils.getGuestBookings();
    setCookieBookings(updatedBookings);
  };

  // Update loading logic for guests
  if (authLoading || (user && loading)) {
    return (
      <div
        className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"} flex items-center justify-center`}
      >
        <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getDynamicPassName = (items: PassDetails[]) => {
    if (!items || items.length === 0) return "Custom Pass";
    const uniqueGames = [...new Set(items.map((i) => i.productName))];
    if (uniqueGames.length === 1) return uniqueGames[0];
    if (uniqueGames.length === 2)
      return `${uniqueGames[0]} & ${uniqueGames[1]}`;
    return `${uniqueGames[0]}, ${uniqueGames[1]} ...`;
  };

  const filteredItems = bookings.filter((item) => {
    const matchesTab = activeTab === "ALL" || item.type === activeTab;

    let matchesUsage = true;
    if (usageFilter === "Available") matchesUsage = item.status === "CONFIRMED";
    if (usageFilter === "Pending") matchesUsage = item.status === "PENDING";
    if (usageFilter === "Cancelled") matchesUsage = item.status === "CANCELLED";
    if (usageFilter === "Refunded") matchesUsage = item.status === "REFUNDED";
    if (usageFilter === "Fully Used")
      matchesUsage = item.ticket?.status === "FULLY_USED";

    return matchesTab && matchesUsage;
  });

  // Guest bookings display logic
  const displayItems = user ? filteredItems : cookieBookings;
  
  // Pagination logic
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = displayItems.slice(startIndex, endIndex);

  return (
    <div
      className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"} py-8 md:py-12 px-4`}
    >
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <div className="text-center md:text-left">
            <h1
              className={`text-3xl md:text-4xl font-black tracking-tight ${isDarkTheme ? "text-white" : "text-slate-900"}`}
            >
              My <span className="text-accent">Tickets</span>
            </h1>
            <p
              className={`mt-1 text-sm ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}
            >
            All your Bora Park tickets in one place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <button
                onClick={() => setIsUsageOpen(!isUsageOpen)}
                className={`w-full flex items-center justify-between sm:justify-start gap-2 px-4 py-3 border rounded-2xl text-xs font-black shadow-sm ${
                  isDarkTheme
                    ? "bg-[#1a1a1a] border-gray-700 text-gray-300"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <CiFilter className="text-lg text-accent stroke-[1.5px]" />
                <span className="uppercase">
                  {usageFilter === "ALL" ? "All Usage" : usageFilter}
                </span>
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {isUsageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 w-44 border rounded-2xl shadow-xl z-50 overflow-hidden p-1.5 ${
                      isDarkTheme
                        ? "bg-[#1a1a1a] border-gray-700"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    {(
                      [
                        "ALL",
                        "Available",
                        "Pending",
                        "Cancelled",
                        "Refunded",
                        "Fully Used",
                      ] as const
                    ).map((usage) => (
                      <button
                        key={usage}
                        onClick={() => {
                          setUsageFilter(usage);
                          setIsUsageOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase rounded-lg transition-colors ${
                          usageFilter === usage
                            ? "text-accent bg-accent/10"
                            : isDarkTheme
                              ? "text-gray-400 hover:bg-gray-700"
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
            <div
              className={`flex p-1 rounded-2xl w-full sm:w-auto border ${
                isDarkTheme
                  ? "bg-slate-700/50 border-gray-600"
                  : "bg-slate-200/50 border-slate-200/50"
              }`}
            >
              {(["ALL", "EVENT", "GAME"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                    activeTab === tab
                      ? isDarkTheme
                        ? "bg-[#1a1a1a] text-accent shadow-sm"
                        : "bg-white text-accent shadow-sm"
                      : isDarkTheme
                        ? "text-gray-400"
                        : "text-slate-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONDITIONAL RENDERING: User vs Guest Interface */}
        {user ? (
          // EXISTING USER INTERFACE - NO CHANGES
          <>
            {/* Tabs and Filters (existing functionality) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 m-5">
              
            </div>
          </>
        ) : (
          // GUEST INTERFACE - Show stored bookings
          cookieBookings.length === 0 ? (
            <div className={`w-full max-w-md mx-auto ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"} rounded-2xl border ${isDarkTheme ? "border-gray-700" : "border-slate-200"} p-8 shadow-lg text-center`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className={`w-8 h-8 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`} />
              </div>
              <h3 className={`text-xl font-black ${isDarkTheme ? "text-white" : "text-slate-900"} mb-2`}>
                No Bookings Yet
              </h3>
              <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-slate-500"} mb-6`}>
                You haven't purchased any tickets yet. Start exploring our events and games!
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/events")}
                  className="px-4 py-2 bg-[#ffd84f] text-gray-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#f0c63f] transition-all"
                >
                  Browse Events
                </button>
                <button
                  onClick={() => router.push("/games")}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  <p className={` ${isDarkTheme ? "text-accent" : "text-slate-900" }`}>Browse Games</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center mb-6">
              <p className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}>
                Showing {cookieBookings.length} booking{cookieBookings.length !== 1 ? 's' : ''} from your purchases
              </p>
            </div>
          )
        )}

        {/* LIST SECTION */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {paginatedItems?.map((item, index) => {
              const { totalQty, totalUsed } = (
                item.ticket?.passDetails || []
              ).reduce(
                (acc: any, i: any) => ({
                  totalQty: acc.totalQty + i.totalQuantity,
                  totalUsed: acc.totalUsed + i.usedQuantity,
                }),
                { totalQty: 0, totalUsed: 0 },
              );

              const isFinished = totalUsed === totalQty;

              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-[32px] md:rounded-[24px] overflow-hidden flex flex-col md:flex-row shadow-sm transition-all ${isFinished ? "opacity-60 grayscale-[0.4]" : ""} ${
                    isDarkTheme
                      ? "bg-[#1a1a1a] border-gray-700"
                      : "bg-white border-slate-100"
                  } border`}
                  style={{
                    clipPath:
                      "polygon(0 24px, 24px 0, calc(100% - 24px) 0, 100% 24px, 100% calc(100% - 24px), calc(100% - 24px) 100%, 24px 100%, 0 calc(100% - 24px))",
                  }}
                >
                  {/* MOBILE TOP BAR / TABLET SIDE BAR */}
                  <div
                    className={`w-full md:w-32 flex md:flex-col items-center justify-between md:justify-center p-5 md:p-6 ${
                      item.type === "EVENT"
                        ? isDarkTheme
                          ? "bg-blue-900/20 text-blue-400"
                          : "bg-blue-200/50 text-blue-900"
                        : isDarkTheme
                          ? "bg-purple-900/20 text-purple-400"
                          : "bg-purple-200/50 text-purple-900"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl md:bg-transparent md:p-0 ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"}`}
                    >
                      {item.type === "EVENT" ? (
                        <Calendar size={28} />
                      ) : (
                        <Gamepad2 size={28} />
                      )}
                    </div>
                    <span className="md:mt-3 hidden md:block text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                      {item.type}
                    </span>
                    <span
                        className={`self-center md:hidden md:self-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isFinished
                            ? isDarkTheme
                              ? "bg-gray-700 text-gray-400"
                              : "bg-slate-100 text-slate-500"
                            : isDarkTheme
                              ? "bg-emerald-900/20 text-emerald-400 border border-emerald-700"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {isFinished
                          ? "Used Up"
                          : totalUsed > 0
                            ? "In Progress"
                            : "Available"}
                      </span>
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="text-center md:text-left">
                        <h3
                          className={`text-xl md:text-2xl font-black leading-tight ${isDarkTheme ? "text-white" : "text-slate-800"}`}
                        >
                          {getDynamicPassName(item.ticket?.passDetails || [])}
                        </h3>
                        <p
                          className={`hidden md:block text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                        >
                          Ref: #{item.bookingReference ? item.bookingReference.slice(0, 10) : 'Unknown'}..
                        </p>
                      </div>

                      <div
                        className={`self-center hidden md:block md:self-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isFinished
                            ? isDarkTheme
                              ? "bg-gray-700 text-gray-400"
                              : "bg-slate-100 text-slate-500"
                            : isDarkTheme
                              ? "bg-emerald-900/20 text-emerald-400 border border-emerald-700"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {isFinished
                          ? "Used Up"
                          : totalUsed > 0
                            ? "In Progress"
                            : "Available"}
                      </div>
                    </div>

                    {/* STATS: Mobile (Rows) vs Tablet (Grid) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                      <div
                        className={`md:bg-transparent p-3 md:p-0 rounded-2xl flex flex-col ${isDarkTheme ? "bg-gray-800" : "bg-slate-50"}`}
                      >
                        <span
                          className={`text-[9px] md:text-[10px] font-bold uppercase mb-1 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                        >
                          Pass Status
                        </span>
                        <span
                          className={`text-sm font-black ${isDarkTheme ? "text-gray-300" : "text-slate-700"}`}
                        >
                          {totalUsed}/{totalQty} Used
                        </span>
                      </div>
                      <div
                        className={`md:bg-transparent p-3 md:p-0 hidden md:block rounded-2xl flex-col ${isDarkTheme ? "bg-gray-800" : "bg-slate-50"}`}
                      >
                        <span
                          className={`text-[9px] md:text-[10px] hidden md:block font-bold uppercase mb-1 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                        >
                          Ready
                        </span>
                        <span className="text-sm font-black hidden md:block text-accent">
                          {totalQty - totalUsed} Tickets
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col">
                        <span
                          className={`text-[10px] font-bold uppercase mb-1 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                        >
                          Date
                        </span>
                        <span
                          className={`text-sm font-bold ${isDarkTheme ? "text-gray-300" : "text-slate-700"}`}
                        >
                          {format(
                            new Date(
                              item.eventDate || item.bookedAt || item.ticket?.expiresAt || Date.now(),
                            ),
                            "MMM dd",
                          )}
                        </span>
                      </div>
                      <div
                        className={`md:bg-transparent p-3 md:p-0 rounded-2xl flex flex-col ${isDarkTheme ? "bg-gray-800" : "bg-slate-50"}`}
                      >
                        <span
                          className={`text-[9px] md:text-[10px] font-bold uppercase mb-1 ${isDarkTheme ? "text-gray-400" : "text-slate-400"}`}
                        >
                          Price
                        </span>
                        <span
                          className={`text-sm font-black ${isDarkTheme ? "text-gray-300" : "text-slate-700"}`}
                        >
                          {Math.round(parseFloat(item.totalAmount || '0'))} ETB
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className={`w-full h-2 rounded-full overflow-hidden ${isDarkTheme ? "bg-gray-700" : "bg-slate-100"}`}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(totalUsed / totalQty) * 100}%` }}
                        className={`h-full ${isFinished ? "bg-slate-400" : "bg-accent"}`}
                      />
                    </div>
                  </div>

                  {/* ACTION: Full width on mobile, side-aligned on desktop */}
                  <div
                    className={`p-4 md:p-8 md:bg-transparent border-t md:border-t-0 md:border-l flex items-center justify-center ${
                      isDarkTheme
                        ? "bg-gray-800/50 border-gray-700"
                        : "bg-slate-50/50 border-slate-100"
                    }`}
                  >
                    <Button
                      onClick={() =>
                        router.push(
                          item.type === "GAME"
                            ? `/my-bookings/${item.id}`
                            : `/my-bookings/${item.id}`,
                        )
                      }
                      className={`w-full md:w-auto rounded-2xl md:rounded-xl font-bold py-6 md:py-2 md:px-8 hover:bg-accent2! hover:text-white! ${
                        isDarkTheme
                          ? "bg-slate-800 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      VIEW TICKET
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
                style={{
                  backgroundColor: currentPage === 1 ? undefined : '#ffd84f',
                  color: currentPage === 1 ? undefined : '#000'
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      currentPage === page
                        ? "w-10"
                        : ""
                    }`}
                    style={{
                      backgroundColor: currentPage === page ? '#ffd84f' : isDarkTheme ? '#374151' : '#d1d5db'
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
                style={{
                  backgroundColor: currentPage === totalPages ? undefined : '#ffd84f',
                  color: currentPage === totalPages ? undefined : '#000'
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {startIndex + 1}-{Math.min(endIndex, displayItems.length)} of {displayItems.length} bookings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
