"use client";
import React, { useState } from "react";
import {
  X,
  Plus,
  ImageIcon,
  Video,
  Users,
  Tag,
  ChevronRight,
  Trash2,
  Gamepad2,
} from "lucide-react";
import { gameService, adminService } from "@/services/adminService";
import { CreateTicketTypeRequest } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import VideoThumbnailCard from "@/components/VideoThumbnailCard";

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

const CATEGORY_COLORS: Record<string, string> = {
  ADULT: "bg-accent/10 text-accent ring-1 ring-accent/20",
  CHILD: "bg-accent/10 text-accent ring-1 ring-accent/20",
  SENIOR: "bg-accent/10 text-accent ring-1 ring-accent/20",
  STUDENT: "bg-accent/10 text-accent ring-1 ring-accent/20",
  GROUP: "bg-accent/10 text-accent ring-1 ring-accent/20",
};

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
    ticketTypes: [] as CreateTicketTypeRequest[],
    mediaFiles: [] as any[],
  });

  const [newTicket, setNewTicket] = useState<CreateTicketTypeRequest>({
    id: null,
    category: "ADULT",
    price: 0,
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
    const preview =
      type === "IMAGE" ? await getTinyPreview(file) : URL.createObjectURL(file);
    const newMedia = { file, type, preview, label: "gallery" };

    if (isGalleryOnly()) {
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

  const handleVideoThumbnailUpload = async (idx: number, file: File) => {
    const tinyThumb = await getTinyPreview(file);
    setFormData((prev) => {
      const updated = [...prev.mediaFiles];
      if (updated[idx]) {
        updated[idx].thumbnailPreview = tinyThumb;
        updated[idx].thumbnail = file;
      }
      return { ...prev, mediaFiles: updated };
    });
  };

  const removeMedia = (index: number) => {
    setFormData((prev) => {
      const updatedMedia = [...prev.mediaFiles];
      if (updatedMedia[index].type === "VIDEO")
        URL.revokeObjectURL(updatedMedia[index].preview);
      updatedMedia.splice(index, 1);
      return { ...prev, mediaFiles: updatedMedia };
    });
  };

  const addCategory = () => {
    if (!newTicket.category || isNaN(newTicket.price))
      return alert("Please provide at least a category and price");
    if (formData.ticketTypes.some((tt) => tt.category === newTicket.category))
      return alert("Category already exists.");
    setFormData((p) => ({
      ...p,
      ticketTypes: [...p.ticketTypes, { ...newTicket }],
    }));
    setNewTicket({
      id: null,
      category: "ADULT",
      price: 0,
      maxQuantityPerBooking: 10,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let media;
      if (formData.mediaFiles.length > 0) {
        const data = new FormData();
        formData.mediaFiles.forEach((m: any, index: number) => {
          data.append("mediaFiles", m.file);
          data.append("label", m.label);
          if (m.thumbnail) {
            data.append(`thumbnail_${index}`, m.thumbnail);
          }
        });
        media = await adminService.uploadProductMedia(data);
      }
      const response = await gameService.createGame({
        ...formData,
        mediaIds: media?.data?.mediaIds,
      });
      setFormData({
        name: "",
        description: "",
        rules: "",
        status: "OPEN",
        ticketTypes: [],
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

  /* ── Derived theme tokens ── */
  const d = isDarkTheme;
  const surface = d ? "bg-[#0d0d0f]" : "bg-[#f8f8fa]";
  const card = d ? "bg-[#141416]" : "bg-white";
  const border = d ? "border-white/[0.06]" : "border-black/[0.06]";
  const inputBg = d ? "bg-[#1c1c1f]" : "bg-[#f0f0f3]";
  const text = d ? "text-white" : "text-[#0d0d0f]";
  const muted = d ? "text-white/40" : "text-black/40";
  const labelCls = `text-[10px] font-semibold uppercase tracking-[0.12em] ${muted}`;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${d ? "bg-black/70" : "bg-black/40"} backdrop-blur-md`}
        onClick={onClose}
      />

      {/* ── Modal shell ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className={`
            relative w-full max-w-5xl max-h-[92vh] flex flex-col
            rounded-[28px] overflow-hidden shadow-2xl
            border ${border}
            ${surface}
            animate-in fade-in zoom-in-95 duration-200
          `}
        >
          {/* ── Decorative top accent bar ── */}
          <div className="h-0.75 w-full bg-linear-to-r from-accent to-accent/80 shrink-0" />

          {/* ── Header ── */}
          <div
            className={`flex items-center justify-between px-8 py-5 border-b ${border} shrink-0`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-accent2/80 to-accent/80`}
              >
                <Gamepad2 size={18} className="text-white" />
              </div>
              <div>
                <h2 className={`text-[17px] font-bold tracking-tight ${text}`}>
                  Create New Attraction
                </h2>
                <p className={`text-[12px] ${muted} mt-0.5`}>
                  Add a new game or attraction to the park
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${d ? "hover:bg-white/8 text-white/50 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1 px-8 py-7">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
              {/* ══════════ LEFT COLUMN ══════════ */}
              <div className="space-y-7">
                {/* — Game Info — */}
                <Section
                  label="Attraction Details"
                  icon={<Gamepad2 size={14} />}
                  isDark={d}
                >
                  <Field label="Attraction Name" labelCls={labelCls}>
                    <input
                      type="text"
                      placeholder="e.g. Thunder Coaster"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent2/50 placeholder:${muted} ${inputBg} ${text}`}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Description" labelCls={labelCls}>
                    <textarea
                      placeholder="Describe the attraction experience..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent2/50 resize-none placeholder:${muted} ${inputBg} ${text}`}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Status" labelCls={labelCls}>
                    <select
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent2/50 ${inputBg} ${text}`}
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
                  </Field>
                </Section>

                {/* — Ticket Types — */}
                <Section
                  label="Ticket Types"
                  icon={<Tag size={14} />}
                  isDark={d}
                >
                  {/* Existing tickets */}
                  {formData.ticketTypes.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.ticketTypes.map((tt, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${border} ${card}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${CATEGORY_COLORS[tt.category] ?? "bg-gray-500/10 text-gray-400"}`}
                            >
                              {tt.category}
                            </span>
                            <div>
                              <p className={`text-xs ${muted}`}>
                                {tt.price} ETB {tt.maxQuantityPerBooking}
                                /booking
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                ticket_types: p.ticketTypes.filter(
                                  (_, i) => i !== index,
                                ),
                              }))
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new ticket */}
                  <div
                    className={`p-5 rounded-2xl border border-dashed ${d ? "border-white/10 bg-white/2" : "border-black/10 bg-black/2"}`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-widest mb-4 ${muted}`}
                    >
                      Add a ticket type
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-accent2/50 transition-all ${inputBg} ${text}`}
                        value={newTicket.category}
                        onChange={(e) =>
                          setNewTicket({
                            ...newTicket,
                            category: e.target.value as any,
                          })
                        }
                      >
                        {["adult", "child", "senior", "student", "group"].map(
                          (cat) => (
                            <option
                              key={cat}
                              value={cat.toUpperCase()}
                              disabled={formData.ticketTypes.some(
                                (tt) => tt.category === cat.toUpperCase(),
                              )}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                          ),
                        )}
                      </select>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Price"
                          className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-accent2/50 transition-all ${inputBg} ${text}`}
                          value={newTicket.price || ""}
                          onChange={(e) =>
                            setNewTicket({
                              ...newTicket,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <span
                          className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${muted}`}
                        >
                          ETB
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          className={`hidden w-full pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-accent2/50 transition-all ${inputBg} ${text}`}
                          value={newTicket.maxQuantityPerBooking}
                          onChange={(e) =>
                            setNewTicket({
                              ...newTicket,
                              maxQuantityPerBooking: parseInt(e.target.value),
                            })
                          }
                        />
                        <span
                          className={` hidden absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wider ${muted} pointer-events-none`}
                        >
                          Max qty
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addCategory}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent2/90 hover:bg-accent/90 text-black text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98]"
                    >
                      <Plus size={14} />
                      Add to list
                    </button>
                  </div>
                </Section>

                {/* — Rules Section — */}
                <Section
                  label="Safety Rules"
                  icon={<Users size={14} />}
                  isDark={d}
                >
                  <Field label="Rules & Requirements" labelCls={labelCls}>
                    <textarea
                      placeholder="e.g. Minimum height: 120cm, No loose articles, Must be accompanied by adult..."
                      rows={4}
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent2/50 resize-none placeholder:${muted} ${inputBg} ${text}`}
                      value={formData.rules}
                      onChange={(e) =>
                        setFormData({ ...formData, rules: e.target.value })
                      }
                    />
                  </Field>
                </Section>
              </div>

              {/* ══════════ RIGHT COLUMN ══════════ */}
              <div className="space-y-7">
                <Section
                  label="Attraction Media"
                  icon={<ImageIcon size={14} />}
                  isDark={d}
                >
                  {/* Quota strip */}
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold ${d ? "bg-white/4" : "bg-black/3"}`}
                  >
                    {[
                      { label: "Posters", count: getPosterCount() },
                      { label: "Banners", count: getBannerCount() },
                      { label: "Videos", count: getVideoCount() },
                    ].map(({ label, count }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={muted}>{label}</span>
                        <span
                          className={`${count >= 3 ? "text-emerald-400" : text}`}
                        >
                          {count}/3
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Upload targets */}
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`group flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${d ? "border-white/10 hover:border-accent/50 hover:bg-accent/5" : "border-black/10 hover:border-accent/50 hover:bg-accent/5"}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${d ? "bg-white/5 group-hover:bg-accent/20" : "bg-black/5 group-hover:bg-accent/20"}`}
                      >
                        <ImageIcon size={16} className="text-accent" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                        Image
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
                        className={`group flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${d ? "border-white/10 hover:border-accent/50 hover:bg-accent/5" : "border-black/10 hover:border-accent/50 hover:bg-accent/5"}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${d ? "bg-white/5 group-hover:bg-accent/20" : "bg-black/5 group-hover:bg-accent/20"}`}
                        >
                          <Video size={16} className="text-accent" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                          Video
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

                  {/* Media grid */}
                  {formData.mediaFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2.5">
                      {formData.mediaFiles.map((media, idx) =>
                        media.type === "IMAGE" ? (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden group shadow-sm"
                          >
                            <img
                              src={media.preview}
                              className="w-full h-full object-cover"
                              alt="preview"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                            {/* Remove btn */}
                            <button
                              onClick={() => removeMedia(idx)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-400 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                            >
                              <X size={11} />
                            </button>
                            {/* Label badge */}
                            <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-all">
                              <span className="bg-black/70 backdrop-blur-sm text-white/80 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                {media.label ?? media.type.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <VideoThumbnailCard
                            key={idx}
                            media={media}
                            index={idx}
                            isDarkTheme={d}
                            muted={muted}
                            onThumbnailUpload={(index, file, preview) => {
                              setFormData((prev) => {
                                const updatedMedia = [...prev.mediaFiles];
                                if (updatedMedia[index]) {
                                  updatedMedia[index].thumbnailPreview =
                                    preview;
                                  updatedMedia[index].thumbnail = file;
                                  updatedMedia[index].preview = preview;
                                }
                                return { ...prev, mediaFiles: updatedMedia };
                              });
                            }}
                            onThumbnailDelete={(index) => {
                              setFormData((prev) => {
                                const updatedMedia = [...prev.mediaFiles];
                                if (updatedMedia[index]) {
                                  updatedMedia[index].thumbnailPreview =
                                    undefined;
                                  updatedMedia[index].thumbnail = undefined;
                                }
                                return { ...prev, mediaFiles: updatedMedia };
                              });
                            }}
                            onRemoveMedia={(index) => removeMedia(index)}
                          />
                        ),
                      )}
                    </div>
                  )}

                  {formData.mediaFiles.length === 0 && (
                    <div
                      className={`flex flex-col items-center justify-center py-8 rounded-2xl ${d ? "bg-white/2" : "bg-black/2"}`}
                    >
                      <ImageIcon size={28} className={`${muted} mb-2`} />
                      <p className={`text-xs font-medium ${muted}`}>
                        No media added yet
                      </p>
                    </div>
                  )}
                </Section>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className={`flex items-center justify-between px-8 py-5 border-t ${border} shrink-0 ${card}`}
          >
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${d ? "bg-white/6 hover:bg-white/10 text-white/70" : "bg-black/5 hover:bg-black/10 text-black/60"}`}
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${muted}`}>
                {formData.ticketTypes.length} ticket type
                {formData.ticketTypes.length !== 1 ? "s" : ""} ·{" "}
                {formData.mediaFiles.length} file
                {formData.mediaFiles.length !== 1 ? "s" : ""}
              </span>
              <button
                disabled={loading}
                onClick={handleCreate}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black
                  bg-linear-to-r from-accent to-accent2/80
                  hover:from-accent2/90 hover:to-accent2/70
                  shadow-lg shadow-accent/30
                  transition-all active:scale-[0.98]
                  ${loading ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Create Attraction <ChevronRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Label picker modal ── */}
      {labelModalOpen && pendingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-60">
          <div
            className={`w-full max-w-sm mx-4 rounded-3xl shadow-2xl overflow-hidden border ${border} ${d ? "bg-[#141416]" : "bg-white"}`}
          >
            <div className={`px-6 pt-6 pb-4 border-b ${border}`}>
              <h3 className={`text-base font-bold ${text}`}>Tag this image</h3>
              <p className={`text-xs mt-0.5 ${muted}`}>
                Choose how this image will be used
              </p>
            </div>
            <div className="p-4">
              <img
                src={pendingFile.preview}
                className="w-full h-36 object-cover rounded-2xl mb-4"
                alt="pending"
              />
              <div className="grid grid-cols-3 gap-2">
                {getAvailableImageLabels().map((label) => (
                  <button
                    key={label}
                    onClick={() => handleLabelSelect(label)}
                    className={`
                      py-3 rounded-xl text-xs font-bold uppercase tracking-widest
                      border-2 transition-all hover:border-accent hover:text-accent
                      ${d ? "border-white/10 text-white/50" : "border-black/10 text-black/50"}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`px-4 pb-4 border-t ${border} pt-3`}>
              <button
                onClick={() => {
                  if (pendingFile?.preview && pendingFile.type === "VIDEO")
                    URL.revokeObjectURL(pendingFile.preview);
                  setPendingFile(null);
                  setLabelModalOpen(false);
                }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${d ? "bg-white/6 hover:bg-white/10 text-white/50" : "bg-black/5 hover:bg-black/10 text-black/50"}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ── Tiny layout helpers ── */
const Section = ({
  label,
  icon,
  isDark,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  isDark: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <span className={`${isDark ? "text-white/30" : "text-black/30"}`}>
        {icon}
      </span>
      <span
        className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? "text-white/40" : "text-black/40"}`}
      >
        {label}
      </span>
      <div className={`flex-1 h-px ${isDark ? "bg-white/6" : "bg-black/6"}`} />
    </div>
    {children}
  </div>
);

const Field = ({
  label,
  labelCls,
  icon,
  children,
}: {
  label: string;
  labelCls: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      {icon}
      <label className={labelCls}>{label}</label>
    </div>
    {children}
  </div>
);

export default CreateGameDrawer;
