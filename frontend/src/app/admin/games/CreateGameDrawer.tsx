"use client";
import React, { useState } from "react";
import { X, Plus, ImageIcon, Video } from "lucide-react";
import { gameService, adminService } from "@/services/adminService";
import { CreateTicketTypeRequest } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

// Helper to generate tiny previews (prevents low-end phone crashes)
const getTinyPreview = (file: File): Promise<string> =>
  new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 300;
        canvas.width = MAX_WIDTH;
        canvas.height = (img.height / img.width) * MAX_WIDTH;
        ctx?.drawImage(img, 0, 0, MAX_WIDTH, canvas.height);
        res(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateGameDrawer = ({ isOpen, onClose, onSuccess }: Props) => {
  const { isDarkTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: "",
    status: "OPEN" as "OPEN" | "ON_MAINTENANCE" | "UPCOMING" | "CLOSED",
    ticket_types: [] as CreateTicketTypeRequest[],
    mediaFiles: [] as any[],
  });

  const [newTicket, setNewTicket] = useState<CreateTicketTypeRequest>({
    name: "",
    category: "ADULT",
    price: 0,
    description: "",
    maxQuantityPerBooking: 10,
  });

  // --- MEDIA HELPERS ---
  const getPosterCount = () =>
    formData.mediaFiles.filter(
      (m) => m.type === "IMAGE" && m.label === "poster",
    ).length;
  const getBannerCount = () =>
    formData.mediaFiles.filter(
      (m) => m.type === "IMAGE" && m.label === "banner",
    ).length;
  const getVideoCount = () =>
    formData.mediaFiles.filter((m) => m.type === "VIDEO").length;
  const hasVideoSlot = () => getVideoCount() < 3;
  const isGalleryOnly = () => getPosterCount() >= 3 && getBannerCount() >= 3;

  const getAvailableImageLabels = (): ("poster" | "banner" | "gallery")[] => {
    const labels: ("poster" | "banner" | "gallery")[] = [];
    if (getPosterCount() < 3) labels.push("poster");
    if (getBannerCount() < 3) labels.push("banner");
    labels.push("gallery");
    return labels;
  };

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "IMAGE" | "VIDEO",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use tiny preview for screen, keep original file for backend
    const preview =
      type === "IMAGE" ? await getTinyPreview(file) : URL.createObjectURL(file);
    const newMedia = { file, type, preview, label: "gallery" };

    if (isGalleryOnly()) {
      // Automatically label as gallery if others are full
      setFormData((p) => ({
        ...p,
        mediaFiles: [...p.mediaFiles, { ...newMedia, label: "gallery" }],
      }));
    } else {
      setPendingFile(newMedia);
      setLabelModalOpen(true);
    }
  };

  const handleLabelSelect = (label: "poster" | "banner" | "gallery") => {
    if (pendingFile) {
      setFormData((prev) => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, { ...pendingFile, label }],
      }));
      setPendingFile(null);
      setLabelModalOpen(false);
    }
  };

  const handleVideoThumbnailUpload = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tinyThumb = await getTinyPreview(file);
    setFormData((prev) => {
      const updated = [...prev.mediaFiles];
      if (updated[idx]) updated[idx].thumbnailPreview = tinyThumb;
      return { ...prev, mediaFiles: updated };
    });
  };

  const removeMedia = (index: number) => {
    setFormData((prev) => {
      const updatedMedia = [...prev.mediaFiles];
      if (updatedMedia[index].type === "VIDEO") {
        URL.revokeObjectURL(updatedMedia[index].preview);
      }
      updatedMedia.splice(index, 1);
      return { ...prev, mediaFiles: updatedMedia };
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await gameService.createGame(formData);
      const newProductId = response.data?.productId;
      if (formData.mediaFiles.length > 0 && newProductId) {
        const data = new FormData();

        formData.mediaFiles.forEach((m: any) => {
          // 1. Append the actual binary file
          data.append("mediaFiles", m.file);

          // 2. Append the associated data (labels/thumbnails)
          // We send these as separate fields. The backend will match them by index.
          data.append("label", m.label);
          data.append("thumbnail", m.thumbnail || null);
        });
        await adminService.uploadProductMedia(newProductId, data);
      }
      setFormData({
        name: "",
        description: "",
        rules: "",
        status: "OPEN",
        ticket_types: [],
        mediaFiles: [],
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create attraction:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 backdrop-blur-sm z-40 ${isDarkTheme ? "bg-black/60" : "bg-slate-900/40"}`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg z-50 shadow-2xl animate-in slide-in-from-right duration-300 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-white"}`}
      >
        <div className="p-8 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleCreate}
              disabled={loading}
              className={`w-full ${isDarkTheme ? "bg-indigo-600" : "bg-gray-800"} text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all transform active:scale-[0.98] ${loading ? "opacity-50" : ""}`}
            >
              {loading ? "Creating..." : "Create Attraction"}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full text-slate-400 ${isDarkTheme ? "hover:bg-gray-800" : "hover:bg-slate-100"}`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto flex-1 pr-2 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                >
                  Attraction Name
                </label>
                <input
                  type="text"
                  className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-white transition-all font-bold ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                  placeholder="e.g. Roller Coaster"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                >
                  Description
                </label>
                <textarea
                  className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-white transition-all font-medium min-h-[80px] ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                  placeholder="Attraction description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                  >
                    Status
                  </label>
                  <select
                    className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-accent2 transition-all font-bold appearance-none ${isDarkTheme ? "bg-gray-800 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="ON_MAINTENANCE">Maintenance</option>
                    <option value="UPCOMING">Coming Soon</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500">
                Ride Media (Images & Video)
              </label>

              {/* Media Counters */}
              <div
                className={`p-3 rounded-xl grid grid-cols-3 text-center text-xs font-bold ${isDarkTheme ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
              >
                <div className={getPosterCount() >= 3 ? "text-green-500" : ""}>
                  Poster ({getPosterCount()}/3)
                </div>
                <div className={getBannerCount() >= 3 ? "text-green-500" : ""}>
                  Banner ({getBannerCount()}/3)
                </div>
                <div className={getVideoCount() >= 3 ? "text-green-500" : ""}>
                  Video ({getVideoCount()}/3)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[24px] cursor-pointer transition-all ${isDarkTheme ? "bg-bg3 border-gray-700 hover:border-white" : "bg-slate-50 border-slate-200 hover:border-indigo-500"}`}
                >
                  <ImageIcon size={20} className="text-accent2 mb-2" />
                  <span className="text-[10px] font-black text-accent2">
                    Add Image
                  </span>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleMediaUpload(e, "IMAGE")}
                  />
                </label>
                {hasVideoSlot() && (
                  <label
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[24px] cursor-pointer transition-all ${isDarkTheme ? "bg-bg3 border-gray-700 hover:border-white" : "bg-slate-50 border-slate-200 hover:border-indigo-500"}`}
                  >
                    <Video size={20} className="text-indigo-500 mb-2" />
                    <span className="text-[10px] font-black text-indigo-500">
                      Add Video
                    </span>
                    <input
                      type="file"
                      hidden
                      accept="video/*"
                      onChange={(e) => handleMediaUpload(e, "VIDEO")}
                    />
                  </label>
                )}
              </div>

              {/* Media Previews */}
              <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {formData.mediaFiles.map((media, idx) => (
                  <div
                    key={idx}
                    className="relative min-w-[120px] h-32 rounded-2xl overflow-hidden group shadow-md"
                  >
                    {media.type === "IMAGE" ? (
                      <img
                        src={media.preview}
                        className="w-full h-full object-cover"
                        alt="preview"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                        <Video size={24} className="text-white/50" />
                        <label className="absolute bottom-2 right-2 p-1 bg-green-500 rounded-full cursor-pointer">
                          <ImageIcon size={10} className="text-white" />
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleVideoThumbnailUpload(idx, e)}
                          />
                        </label>
                        {media.thumbnailPreview && (
                          <div className="absolute top-2 left-2 w-8 h-8 rounded border-2 border-green-400 overflow-hidden">
                            <img
                              src={media.thumbnailPreview}
                              className="object-cover"
                              alt="thumb"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-green-400 font-bold uppercase">
                      {media.type} {media.label && `• ${media.label}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Matrix */}
            <div className="space-y-6">
              {formData.ticket_types.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.ticket_types.map((tt, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-2xl shadow-sm ${isDarkTheme ? "bg-[#1a1a1a] border border-gray-700" : "bg-white border border-indigo-100"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${isDarkTheme ? "bg-gray-700 text-gray-200" : "bg-indigo-50 text-indigo-600"}`}
                          >
                            {tt.category}
                          </span>
                          <h4
                            className={`text-sm font-bold ${isDarkTheme ? "text-white" : "text-slate-800"}`}
                          >
                            {tt.name}
                          </h4>
                        </div>
                        <p
                          className={`text-xs font-medium ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}
                        >
                          {tt.price} ETB
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            ticket_types: formData.ticket_types.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`p-6 rounded-[32px] border-2 border-dashed space-y-4 ${isDarkTheme ? "bg-[#1a1a1a] border-gray-700" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`p-2 rounded-lg ${isDarkTheme ? "bg-indigo-600" : "bg-gray-800"}`}
                  >
                    <Plus size={16} className="text-white" />
                  </div>
                  <h3
                    className={`text-sm font-black uppercase tracking-tight ${isDarkTheme ? "text-white" : "text-slate-800"}`}
                  >
                    Add Ticket Category
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Name"
                    className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700 text-white" : "bg-white border-slate-200"}`}
                    value={newTicket.name}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, name: e.target.value })
                    }
                  />
                  <select
                    className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700 text-white" : "bg-white border-slate-200"}`}
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        category: e.target.value as any,
                      })
                    }
                  >
                    {["ADULT", "CHILD", "SENIOR", "STUDENT", "GROUP"].map(
                      (cat) => (
                        <option
                          key={cat}
                          value={cat}
                          disabled={formData.ticket_types.some(
                            (tt) => tt.category === cat,
                          )}
                        >
                          {cat}
                        </option>
                      ),
                    )}
                  </select>
                  <input
                    type="number"
                    placeholder="Price"
                    className={`w-full p-3 rounded-xl border outline-none text-sm ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700 text-white" : "bg-white border-slate-200"}`}
                    value={newTicket.price || ""}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <input
                    type="number"
                    className={`w-full p-3 rounded-xl border outline-none text-sm ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700 text-white" : "bg-white border-slate-200"}`}
                    value={newTicket.maxQuantityPerBooking}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        maxQuantityPerBooking: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <textarea
                  placeholder="Short description..."
                  rows={2}
                  className={`w-full p-3 rounded-xl border outline-none text-sm ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700 text-white" : "bg-white border-slate-200"}`}
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      ticket_types: [...formData.ticket_types, newTicket],
                    })
                  }
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase ${isDarkTheme ? "bg-indigo-600 text-white" : "bg-gray-800 text-white"}`}
                >
                  Add Category to List
                </button>
              </div>
            </div>

            {/* Ride Rules */}
            <div className="space-y-2">
              <label
                className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
              >
                Ride Rules
              </label>
              <textarea
                className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none font-medium min-h-[100px] ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                placeholder="e.g. Minimum height: 120cm..."
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Label Modal */}
      {labelModalOpen && pendingFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div
            className={`w-full max-w-md p-6 rounded-2xl ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"}`}
          >
            <h3 className="text-lg font-bold mb-4">Select Image Label</h3>
            <img
              src={pendingFile.preview}
              className="w-full h-32 object-cover rounded-lg mb-4"
              alt="pending"
            />
            <div className="grid grid-cols-2 gap-3">
              {getAvailableImageLabels().map((label) => (
                <button
                  key={label}
                  onClick={() => handleLabelSelect(label)}
                  className="p-3 border-2 rounded-xl text-accent font-bold uppercase text-xs hover:border-accent2 transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateGameDrawer;
