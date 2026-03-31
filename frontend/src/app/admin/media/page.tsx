"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { adminService } from "@/services/adminService";
import {
  Image as ImageIcon,
  Video,
  X,
  Play,
  Maximize2,
  Hash,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash,
  Edit3,
} from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  label: string;
  provider: string;
}

export default function MediaPage() {
  const { isDarkTheme } = useTheme();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [deleteModal, setDeleteModal] = useState<MediaItem | null>(null);
  const [labelModal, setLabelModal] = useState<MediaItem | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingLabel, setIsUpdatingLabel] = useState(false);

  // Predefined label options
  const labelOptions = ["banner", "poster", "gallery"];

  const d = isDarkTheme;
  const surface = d ? "bg-[#0d0d0f]" : "bg-[#f8f8fa]";
  const card = d ? "bg-[#141416]" : "bg-white";
  const border = d ? "border-white/[0.06]" : "border-black/[0.06]";
  const text = d ? "text-white" : "text-[#0d0d0f]";
  const muted = d ? "text-white/40" : "text-black/40";

  useEffect(() => {
    fetchMedia();
  }, [currentPage, filter]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request media from adminService
      const response = await adminService.getAllMedia(currentPage, 32, filter);

      if (response.success && response.data) {
        // --- FIX: Access nested media and pagination objects ---
        const mediaList = response.data?.media || [];
        const pagination = response.data?.pagination || {};

        setMedia(mediaList);
        setTotalItems(pagination.total || mediaList.length);
        setTotalPages(pagination.totalPages || 1);

        console.log("✅ UI State Updated:", {
          itemsOnPage: mediaList.length,
          totalItems: pagination.total,
          totalPages: pagination.totalPages,
        });
      } else {
        setError(response.message || "Failed to load gallery");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Failed to connect to the media service.");
    } finally {
      setLoading(false);
    }
  };

  // Stats are based on totalItems from the backend
  const stats = {
    total: totalItems,
    images:
      filter === "image"
        ? totalItems
        : media.filter((m) => m.type?.startsWith("image/")).length,
    videos:
      filter === "video"
        ? totalItems
        : media.filter((m) => m.type?.startsWith("video/")).length,
  };

  // Handler functions
  const handleDeleteMedia = async (item: MediaItem) => {
    setIsDeleting(true);
    try {
      const response = await adminService.deleteMedia(item.id);
      if (response.success) {
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
        setTotalItems((prev) => prev - 1);
        setDeleteModal(null);
      } else {
        setError(response.message || "Failed to delete media");
      }
    } catch (err: any) {
      setError("Failed to delete media");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateLabel = async () => {
    if (!labelModal) return;

    setIsUpdatingLabel(true);
    try {
      await adminService.updateMediaLabel(labelModal.id, newLabel);
      setMedia(prev => prev.map(m => 
        m.id === labelModal.id ? { ...m, label: newLabel } : m
      ));
      setLabelModal(null);
      setNewLabel('');
    } catch (err: any) {
      setError("Failed to update label");
    } finally {
      setIsUpdatingLabel(false);
    }
  };

  const openLabelModal = (item: MediaItem) => {
    setLabelModal(item);
    setNewLabel(item.label || "");
  };

  if (loading && media.length === 0)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${surface}`}
      >
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className={`min-h-screen ${surface} pt-24 pb-20 px-6 md:px-10`}>
      <div className="max-w-7xl mx-auto">
        {/* --- HEADER SECTION --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                <Layers size={20} className="text-black" />
              </div>
              <span
                className={`text-[11px] font-black uppercase tracking-[0.2em] ${muted}`}
              >
                Central Assets
              </span>
            </div>
            <h1
              className={`text-5xl md:text-7xl font-black tracking-tighter ${text}`}
            >
              Media <span className="text-accent italic">Library</span>
            </h1>
          </div>

          <div
            className={`flex items-center gap-8 px-8 py-5 rounded-4xl border ${border} ${card} shadow-sm`}
          >
            {[
              { label: "Total", value: stats.total, icon: <Hash size={14} /> },
              {
                label: "Images",
                value: stats.images,
                icon: <ImageIcon size={14} />,
              },
              {
                label: "Videos",
                value: stats.videos,
                icon: <Video size={14} />,
              },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-accent">{s.icon}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}
                  >
                    {s.label}
                  </span>
                </div>
                <span className={`text-xl font-black ${text}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </header>

        {/* --- FILTER & PAGINATION CONTROLS --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex gap-2 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5">
            {(["all", "image", "video"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilter(type);
                  setCurrentPage(1);
                }}
                className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                  filter === type
                    ? "bg-accent text-black shadow-lg shadow-accent/20"
                    : `text-gray-500 hover:text-accent`
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`group relative px-6 py-3 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest border-2 ${
                currentPage === 1
                  ? "opacity-20 cursor-not-allowed border-gray-700/20"
                  : "border-accent2 bg-accent/10 hover:border-accent hover:bg-accent/50 hover:scale-105 active:scale-95"
              }`}
            >
              <span className="flex items-center text-accent2 gap-2">
                <ChevronLeft size={16} />
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded-xl font-bold text-sm border ${border} ${card} transition-all ${
                  currentPage === 1
                    ? "bg-accent text-black"
                    : "bg-accent/50 text-white hover:bg-accent2/70 hover:scale-105 active:scale-95"
                }`}
              >
                1
              </button>

              {totalPages > 2 && (
                <>
                  {currentPage > 3 && (
                    <span className="text-gray-500 font-bold">...</span>
                  )}

                  {currentPage > 1 && currentPage < totalPages && (
                    <button
                      onClick={() => setCurrentPage(currentPage)}
                      className="w-10 h-10 rounded-xl font-bold text-sm bg-accent text-black border-2 border-accent"
                    >
                      {currentPage}
                    </button>
                  )}

                  {currentPage < totalPages - 2 && (
                    <span className="text-gray-500 font-bold">...</span>
                  )}
                </>
              )}

              {totalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 rounded-xl font-bold text-sm border ${border} ${card} transition-all ${
                    currentPage === totalPages
                      ? "bg-accent text-black"
                      : "bg-accent/50 text-white hover:bg-accent2/70 hover:scale-105 active:scale-95"
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`group relative px-6 py-3 rounded-2xl transition-all font-bold hover:scale-110  text-[11px] uppercase tracking-widest border-2 ${
                currentPage === totalPages
                  ? "opacity-20 cursor-not-allowed border-gray-700/20"
                  : "border-accent bg-accent/10 hover:border-accent2 hover:scale-110 hover:bg-accent/50  active:scale-95"
              }`}
            >
              <span className="flex items-center text-accent2 gap-2">
                <ChevronRight size={16} />
              </span>
            </button>
          </div>
        </div>

        {/* --- MEDIA GRID --- */}
        {media.length === 0 && !loading ? (
          <div className="py-20 text-center opacity-40 font-bold uppercase tracking-widest">
            No items found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {media.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`group relative rounded-4xl border ${border} ${card} overflow-hidden hover:border-accent/50 hover:shadow-2xl transition-all duration-500`}
              >
                <div className="relative aspect-square overflow-hidden bg-black/20">
                  {item.type?.startsWith("image/") ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={40} className="text-accent opacity-20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                          <Play size={24} className="text-black ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                      {item.label || "Asset"}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setSelectedMedia(item)}
                      className="p-4 bg-white text-black rounded-2xl hover:bg-accent transition-all transform translate-y-4 group-hover:translate-y-0 shadow-2xl"
                    >
                      <Maximize2 size={24} />
                    </button>
                    <button
                      onClick={() => openLabelModal(item)}
                      className="p-4 bg-accent text-black rounded-2xl hover:bg-accent/80 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-2xl"
                    >
                      <Edit3 size={24} />
                    </button>
                    <button
                      onClick={() => setDeleteModal(item)}
                      className="p-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-2xl"
                    >
                      <Trash size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className={`text-sm font-bold truncate mb-1 ${text}`}>
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between opacity-50">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest`}
                    >
                      {item.provider}
                    </p>
                    <p className="text-[10px] font-black uppercase">
                      {item.type?.split("/")?.[1] || "N/A"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* --- LIGHTBOX --- */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-8 right-8 z-10 p-4 bg-white/10 text-white rounded-2xl hover:bg-accent/50 transition-all"
            >
              <X size={24} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl flex flex-col items-center"
            >
              <div className="relative w-full h-[70vh] flex items-center justify-center rounded-[48px] overflow-hidden shadow-2xl bg-black/40 border border-white/5">
                {selectedMedia.type?.startsWith("image/") ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    crossOrigin="anonymous"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    crossOrigin="anonymous"
                    className="max-w-full max-h-full"
                  />
                )}
              </div>

              <div className="mt-8 text-center">
                <span className="px-4 py-1 bg-accent text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3 inline-block">
                  {selectedMedia.label || "Asset"}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                  {selectedMedia.name}
                </h2>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md rounded-3xl p-8 ${card} border ${border} shadow-2xl`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash size={32} className="text-red-500" />
                </div>
                <h3 className={`text-2xl font-black mb-3 ${text}`}>
                  Delete Media?
                </h3>
                <p className={`${muted} mb-8`}>
                  Are you sure you want to delete "{deleteModal.name}"? This
                  action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeleteModal(null)}
                    disabled={isDeleting}
                    className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all ${
                      d
                        ? "bg-gray-800 text-white hover:bg-gray-700"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteMedia(deleteModal)}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash size={18} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LABEL EDIT MODAL --- */}
      <AnimatePresence>
        {labelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md rounded-3xl p-8 ${card} border ${border} shadow-2xl`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Edit3 size={32} className="text-accent" />
                </div>
                <h3 className={`text-2xl font-black mb-3 ${text}`}>
                  Change Label
                </h3>
                <p className={`${muted} mb-6`}>
                  Update the label for "{labelModal.name}"
                </p>
                <select
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border ${border} ${card} ${text} mb-6 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer`}
                  autoFocus
                >
                  <option value="">Select a label...</option>
                  {labelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setLabelModal(null);
                      setNewLabel("");
                    }}
                    disabled={isUpdatingLabel}
                    className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all ${
                      d
                        ? "bg-gray-800 text-white hover:bg-gray-700"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } ${isUpdatingLabel ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateLabel}
                    disabled={isUpdatingLabel || !newLabel.trim()}
                    className="flex-1 px-6 py-3 bg-accent text-black rounded-2xl font-bold hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingLabel ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit3 size={18} />
                        Update
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
