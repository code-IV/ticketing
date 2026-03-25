"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Game } from "@/types";
import { gameService } from "@/services/adminService";
import {
  ArrowUpRight,
  Zap,
  ChevronLeft,
  ChevronRight,
  Share2,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const gameVisuals = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
];

export default function GamesListingPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await gameService.getAll();
        if (response.success && response.data) {
          // Map database response to match Game interface
          let mappedGames = response.data.map((game: any) => ({
            ...game,
            category: game.category || "Adventure", // Default category if not present
            capacity: game.capacity || 10, // Default capacity if not present
          }));

          setGames(mappedGames);
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Responsive items per page logic
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerPage(12); // Desktop
      } else if (width >= 768) {
        setItemsPerPage(10); // Tablet
      } else {
        setItemsPerPage(8); // Mobile
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const filteredGames =
    filter === "ALL"
      ? games
      : games.filter((g) => {
          const status = filter === "MAINTENANCE" ? "ON_MAINTENANCE" : filter;
          return g.status === status;
        });
  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGames = filteredGames.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-white"}`}
      >
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 animate-pulse" />
          <span
            className={`font-light tracking-wider ${isDarkTheme ? "text-gray-400" : "text-gray-400"}`}
          >
            loading adventures...
          </span>
        </div>
      </div>
    );

  return (
    <div
      className={`min-h-screen ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-white"}`}
    >
      {/* Abstract shapes in background with #ffd84f */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(255,216,79,${isDarkTheme ? 0.4 : 0.8}) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(255,216,79,${isDarkTheme ? 0.4 : 0.8}) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Hero – crisp and minimal */}
      <section className="relative pt-10 md:p-24 md:pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="max-w-3xl mx-auto"
        >
          <h1
            className={`text-5xl md:text-7xl font-black tracking-tight mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            pure <span style={{ color: "#ffd84f" }}>adrenaline</span>
          </h1>
        </motion.div>
      </section>

      {/* Filter – subtle underline style */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-wrap justify-center gap-8">
          {["ALL", "OPEN", "UPCOMING", "MAINTENANCE", "CLOSED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-lg font-extrabold transition-all pb-1 ${
                filter === f
                  ? "border-b-2"
                  : "text-gray-300 hover:text-gray-500"
              }`}
              style={
                filter === f
                  ? { color: "#ffd84f", borderBottomColor: "#ffd84f" }
                  : {}
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid – original dark card design with #ffd84f accents */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{ y: -10 }}
              onClick={() => {
                // Only navigate for real games, not mock games
                if (!game.id.startsWith("mock-")) {
                  router.push(`/games/${game.id}`);
                }
              }}
              className={`group relative h-[520px] rounded-[48px] overflow-hidden border-2 border-transparent transition-all duration-500 shadow-xl hover:border-[#ffd84f]/30 ${
                game.id.startsWith("mock-")
                  ? "cursor-not-allowed opacity-75"
                  : "cursor-pointer"
              }`}
            >
              {/* Image Background Layer */}
              <div className="absolute inset-0">
                <img
                  src={gameVisuals[index % 3]}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt={game.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
              </div>

              {/* Status Badge */}
              <div className="absolute top-8 left-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
                    {game.status}
                  </span>
                </div>
              </div>

              {/* Price Tag Overlay – #ffd84f background with black text for contrast */}
              <div
                className="absolute top-8 right-8 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform"
                style={{ backgroundColor: "#ffd84f" }}
              >
                <span className="text-[8px] font-black uppercase opacity-80 text-black">
                  From
                </span>
                <span className="text-sm font-black italic text-black">
                  {game.ticket_types?.[0]?.price ?? "0"}
                </span>
              </div>

              {/* Bottom Content Area */}
              <div className="absolute bottom-0 left-0 right-0 p-10">
                {/* <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} style={{ color: '#ffd84f' }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ffd84f' }}>Zone B-0{index + 1}</span>
                </div> */}

                <h3
                  className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-4 group-hover transition-colors"
                  style={{ "--hover-color": "#ffd84f" } as React.CSSProperties}
                >
                  {game.name}
                </h3>

                <p className="text-slate-300/80 text-sm line-clamp-2 mb-8 font-medium leading-relaxed group-hover:text-white transition-colors">
                  {game.description}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                    style={{ hover: { color: "#000" } } as React.CSSProperties} // fallback: we'll use a class for hover text color
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#000")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                  >
                    Quick View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGame(game);
                      setShowShareModal(true);
                    }}
                    className="py-4 px-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                    style={{ hover: { color: "#000" } } as React.CSSProperties}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#000")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/buy?id=${game.id}`);
                    }}
                    className="flex-[1.5] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#ffd84f", color: "#000" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e6c247")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#ffd84f")
                    }
                  >
                    Get Tickets <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
                style={{
                  backgroundColor: currentPage === 1 ? undefined : "#ffd84f",
                  color: currentPage === 1 ? undefined : "#000",
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                >
                  Page
                </span>
                <span
                  className={`text-lg font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                >
                  {currentPage}
                </span>
                <span
                  className={`text-sm font-medium ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                >
                  of {totalPages}
                </span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
                style={{
                  backgroundColor:
                    currentPage === totalPages ? undefined : "#ffd84f",
                  color: currentPage === totalPages ? undefined : "#000",
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Page indicator dots */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentPage === page ? "w-8" : ""
                    }`}
                    style={{
                      backgroundColor:
                        currentPage === page
                          ? "#ffd84f"
                          : isDarkTheme
                            ? "#374151"
                            : "#d1d5db",
                    }}
                  />
                ),
              )}
            </div>
          </div>
        )}

        {filteredGames.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-300 font-light">
              no games match your filter.
            </p>
          </div>
        )}
      </div>

      {/* Minimal footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-300 font-light">
        <span>© Bora Park – fresh perspective</span>
      </footer>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedGame && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowShareModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md rounded-3xl shadow-2xl border ${
                isDarkTheme
                  ? "bg-[#1a1a1a] border-[#ffd84f]"
                  : "bg-white border-[#ffd84f]"
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-6 border-b ${
                  isDarkTheme ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-black ${isDarkTheme ? "text-white" : "text-gray-900"}`}
                >
                  Share {selectedGame.name}
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDarkTheme
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Share Options */}
              <div className="p-6 space-y-4">
                {/* Copy Link */}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/games/${selectedGame.id}`;
                    navigator.clipboard.writeText(url);
                    setShowShareModal(false);
                  }}
                  className={`w-full p-4 rounded-2xl border font-black text-sm uppercase tracking-widest transition-all hover:scale-105 ${
                    isDarkTheme
                      ? "bg-[#ffd84f] text-black border-[#ffd84f]"
                      : "bg-[#ffd84f] text-black border-[#ffd84f]"
                  }`}
                >
                  Copy Link
                </button>

                {/* Native Share (if available) */}
                {typeof navigator !== "undefined" && navigator.share && (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/games/${selectedGame.id}`;
                      navigator.share({
                        title: selectedGame.name,
                        text: `Check out this game at Bora Park: ${selectedGame.name}`,
                        url: url,
                      });
                      setShowShareModal(false);
                    }}
                    className={`w-full p-4 rounded-2xl border font-black text-sm uppercase tracking-widest transition-all hover:scale-105 ${
                      isDarkTheme
                        ? "bg-white/10 text-white border-gray-600 hover:bg-white/20"
                        : "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    Share via System
                  </button>
                )}

                {/* Social Media Options */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/games/${selectedGame.id}`;
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(`Check out this game at Bora Park: ${selectedGame.name} ${url}`)}`,
                        "_blank",
                      );
                    }}
                    className={`p-3 rounded-xl border transition-all hover:scale-105 ${
                      isDarkTheme
                        ? "bg-green-600/20 border-green-600 text-green-400 hover:bg-green-600/30"
                        : "bg-green-50 border-green-600 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    <span className="text-xs font-bold">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/games/${selectedGame.id}`;
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this game at Bora Park: ${selectedGame.name}`)}&url=${encodeURIComponent(url)}`,
                        "_blank",
                      );
                    }}
                    className={`p-3 rounded-xl border transition-all hover:scale-105 ${
                      isDarkTheme
                        ? "bg-blue-600/20 border-blue-600 text-blue-400 hover:bg-blue-600/30"
                        : "bg-blue-50 border-blue-600 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <span className="text-xs font-bold">Twitter</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/games/${selectedGame.id}`;
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                        "_blank",
                      );
                    }}
                    className={`p-3 rounded-xl border transition-all hover:scale-105 ${
                      isDarkTheme
                        ? "bg-blue-700/20 border-blue-700 text-blue-400 hover:bg-blue-700/30"
                        : "bg-blue-50 border-blue-700 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <span className="text-xs font-bold">Facebook</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .group:hover h3 {
          color: #ffd84f;
        }
        .group:hover .quick-view {
          color: #000;
        }
      `}</style>
    </div>
  );
}
