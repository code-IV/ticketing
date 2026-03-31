"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  ImageIcon,
  Video,
  Calendar,
  Clock,
  Users,
  Tag,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Play,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { eventService } from "@/services/eventService";
import { CreateTicketTypeRequest } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter, useParams } from "next/navigation";
import VideoThumbnailCard from "@/components/VideoThumbnailCard";
import ConfirmationModal from "@/components/ConfirmationModal";

const getTinyPreview = (file: File): Promise<string> =>
  new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 300;
        canvas.height = (img.height / img.width) * 300;
        ctx?.drawImage(img, 0, 0, 300, canvas.height);
        res(canvas.toDataURL("jpeg", 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

// Helper to convert backend MIME type to internal type constant
const inferMediaType = (media: any): "image" | "video" => {
  if (media.type) {
    // If it's already our constant, return it
    if (media.type === "image" || media.type === "video") return media.type;
    // Otherwise treat MIME type
    if (media.type.startsWith("image/")) return "image";
    if (media.type.startsWith("video/")) return "video";
  }
  if (media.mimeType) {
    if (media.mimeType.startsWith("image/")) return "image";
    if (media.mimeType.startsWith("video/")) return "video";
  }
  if (media.url) {
    const url = media.url.toLowerCase();
    if (url.match(/\.(mp4|mov|webm|avi|mkv)$/)) return "video";
  }
  return "image"; // default
};

const CATEGORY_COLORS: Record<string, string> = {
  ADULT: "bg-accent/10 text-accent ring-1 ring-accent/20",
  CHILD: "bg-accent/10 text-accent ring-1 ring-accent/20",
  SENIOR: "bg-accent/10 text-accent ring-1 ring-accent/20",
  STUDENT: "bg-accent/10 text-accent ring-1 ring-accent/20",
  GROUP: "bg-accent/10 text-accent ring-1 ring-accent/20",
};

export default function EditEventPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [previewModal, setPreviewModal] = useState<{
    media: any;
    type: "image" | "video";
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "ticket" | "media";
    index: number;
    isExisting: boolean;
    item: any;
  }>({
    isOpen: false,
    type: "ticket",
    index: -1,
    isExisting: false,
    item: null,
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  const [labelModal, setLabelModal] = useState<{
    isOpen: boolean;
    media: any;
    isExisting: boolean;
    currentLabel: string;
  }>({
    isOpen: false,
    media: null,
    isExisting: false,
    currentLabel: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    capacity: "",
    isActive: true,
    status: "ACTIVE" as "ACTIVE" | "CANCELLED" | "COMPLETED" | "UPCOMING",
    ticket_types: [] as CreateTicketTypeRequest[],
    mediaFiles: [] as any[],
  });

  const [newTicket, setNewTicket] = useState<CreateTicketTypeRequest>({
    id: null,
    category: "ADULT",
    price: 0,
    maxQuantityPerBooking: 10,
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(eventId);
      const eventData = response.data?.event;
      setEvent(eventData);

      if (eventData) {
        const formDataValues = {
          name: eventData.name || "",
          description: eventData.description || "",
          eventDate: eventData.eventDate
            ? new Date(eventData.eventDate).toISOString().split("T")[0]
            : "",
          startTime: eventData.startTime || "",
          endTime: eventData.endTime || "",
          capacity: eventData.capacity?.toString() || "",
          isActive: eventData.isActive !== false,
          status: eventData.status || "ACTIVE",
          ticket_types:
            eventData.ticketTypes?.map((tt: any) => ({
              id: tt.id || null,
              category: tt.category || "ADULT",
              price: parseFloat(tt.price) || 0,
              maxQuantityPerBooking: tt.max_quantity_per_booking || 10,
            })) || [],
          mediaFiles: [],
        };

        setFormData(formDataValues);

        // Store original data for change detection
        setOriginalData(formDataValues);

        // Load existing media
        if (eventData.gallery && eventData.gallery.length > 0) {
          setExistingMedia(
            eventData.gallery.map((media: any, index: number) => {
              return {
                ...media,
                existing: true,
                type: inferMediaType(media), // <-- critical fix
                preview: media.url,
                // Try multiple possible thumbnail field names
                thumbnailPreview: media.thumbnailUrl || null,
                thumbnail: media.thumbnailUrl
                  ? {
                      name: "thumbnail",
                      url: media.thumbnailUrl,
                    }
                  : null,
              };
            }),
          );
        } else {
          // No gallery data found
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const hasFieldChanged = (original: any, current: any, field: string) => {
    // Handle null values - if original is null and current has content, it's a change
    if (original === null && current !== null) return true;
    if (original === null && current === null) return false;
    if (original !== null && current === null) return true; // Text → Null case

    // Handle number vs string conversions
    if (typeof original === "number" && typeof current === "string") {
      return original !== parseFloat(current);
    }
    if (typeof original === "string" && typeof current === "number") {
      return parseFloat(original) !== current;
    }

    return original !== current;
  };

  const getTicketTypeChanges = (original: any[], current: any[]) => {
    const changes: any[] = [];

    if (!original || original.length === 0) return current;
    if (!current || current.length === 0) return [];

    current.forEach((currentTT) => {
      const originalTT = original.find((o) => o.id === currentTT.id);

      if (!originalTT) {
        // New ticket type
        changes.push({
          ...currentTT,
          price: parseFloat(currentTT.price.toString()),
        });
      } else {
        // Check if anything actually changed
        const categoryChanged = originalTT.category !== currentTT.category;
        const priceChanged =
          originalTT.price !== parseFloat(currentTT.price.toString());
        const maxQtyChanged =
          originalTT.maxQuantityPerBooking !== currentTT.maxQuantityPerBooking;

        if (categoryChanged || priceChanged || maxQtyChanged) {
          // Modified ticket type - send complete object
          changes.push({
            id: currentTT.id,
            category: currentTT.category,
            price: parseFloat(currentTT.price.toString()),
            maxQuantityPerBooking: currentTT.maxQuantityPerBooking,
          });
        }
      }
    });

    return changes;
  };

  const getPosterCount = () => {
    const existingPosters = existingMedia.filter(
      (m) => m.label === "poster",
    ).length;
    const newPosters = formData.mediaFiles.filter(
      (m) => m.label === "poster",
    ).length;
    return existingPosters + newPosters;
  };

  const getBannerCount = () => {
    const existingBanners = existingMedia.filter(
      (m) => m.label === "banner",
    ).length;
    const newBanners = formData.mediaFiles.filter(
      (m) => m.label === "banner",
    ).length;
    return existingBanners + newBanners;
  };

  const getVideoCount = () => {
    const existingVideos = existingMedia.filter(
      (m) => m.type === "VIDEO",
    ).length;
    const newVideos = formData.mediaFiles.filter(
      (m) => m.type === "VIDEO",
    ).length;
    return existingVideos + newVideos;
  };

  const hasPosterSlot = () => getPosterCount() < 3;
  const hasBannerSlot = () => getBannerCount() < 3;
  const hasVideoSlot = () => getVideoCount() < 3;
  const isGalleryOnly = () => !hasPosterSlot() && !hasBannerSlot();

  const getAvailableImageLabels = (): ("banner" | "poster" | "gallery")[] => {
    const labels: ("banner" | "poster" | "gallery")[] = [];
    if (hasPosterSlot()) labels.push("poster");
    if (hasBannerSlot()) labels.push("banner");
    labels.push("gallery");
    return labels;
  };

  const EditLabelModal = () => {
    const [newLabel, setNewLabel] = useState("");
    const [loading, setLoading] = useState(false);

    const { isDarkTheme } = useTheme();
    const d = isDarkTheme;
    const card = d ? "bg-[#141416]" : "bg-white";
    const border = d ? "border-white/[0.06]" : "border-black/[0.06]";
    const text = d ? "text-white" : "text-[#0d0d0f]";
    const muted = d ? "text-white/40" : "text-black/40";

    useEffect(() => {
      if (labelModal.isOpen) {
        setNewLabel(labelModal.currentLabel);
      }
    }, [labelModal.isOpen, labelModal.currentLabel]);

    const handleSave = async () => {
      if (!newLabel || !["poster", "banner", "gallery"].includes(newLabel)) {
        setError("Please enter a valid label: poster, banner, or gallery");
        return;
      }

      setLoading(true);
      try {
        if (labelModal.isExisting && labelModal.media.id) {
          await adminService.updateMediaLabel(labelModal.media.id, newLabel);

          setExistingMedia((prev) =>
            prev.map((m) =>
              m.id === labelModal.media.id ? { ...m, label: newLabel } : m,
            ),
          );
        } else {
          setFormData((prev) => ({
            ...prev,
            mediaFiles: prev.mediaFiles.map((m) =>
              m === labelModal.media ? { ...m, label: newLabel } : m,
            ),
          }));
        }

        // Create updated media object for preview modal
        const updatedMedia = { ...labelModal.media, label: newLabel };

        // Close label modal and reopen preview modal with updated media
        setLabelModal({
          isOpen: false,
          media: null,
          isExisting: false,
          currentLabel: "",
        });

        // Reopen preview modal with updated media
        setTimeout(() => {
          setPreviewModal({
            media: updatedMedia,
            type: inferMediaType(updatedMedia),
            isExisting: labelModal.isExisting,
          });
        }, 100); // Small delay to ensure smooth transition
      } catch (err: any) {
        setError("Failed to update label");
      } finally {
        setLoading(false);
      }
    };

    const handleClose = () => {
      if (!loading) {
        setLabelModal({
          isOpen: false,
          media: null,
          isExisting: false,
          currentLabel: "",
        });
      }
    };

    return (
      <AnimatePresence>
        {labelModal.isOpen && (
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
                  <Tag size={32} className="text-accent" />
                </div>
                <h3 className={`text-2xl font-black mb-3 ${text}`}>
                  Change Label
                </h3>
                <p className={`${muted} mb-6`}>
                  Update the label for "{labelModal.media?.name || "Media"}"
                </p>
                <select
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border ${border} ${card} ${text} mb-6 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer`}
                  autoFocus
                >
                  <option value="">Select a label...</option>
                  <option value="poster">Poster</option>
                  <option value="banner">Banner</option>
                  <option value="gallery">Gallery</option>
                </select>
                <div className="flex gap-4">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all ${
                      d
                        ? "bg-gray-800 text-white hover:bg-gray-700"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || !newLabel.trim()}
                    className="flex-1 px-6 py-3 bg-accent text-black rounded-2xl font-bold hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Tag size={18} />
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
    );
  };

  const handleEditLabel = (media: any, isExisting: boolean = false) => {
    setLabelModal({
      isOpen: true,
      media,
      isExisting,
      currentLabel: media.label || "gallery",
    });
  };

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "IMAGE" | "VIDEO",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview =
      type === "IMAGE" ? await getTinyPreview(file) : URL.createObjectURL(file);
    const newMedia = { file, type, name: "", url: "", provider: "", preview };
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

  const handleLabelSelect = (label: "banner" | "poster" | "gallery") => {
    if (pendingFile) {
      setFormData((p) => ({
        ...p,
        mediaFiles: [...p.mediaFiles, { ...pendingFile, label }],
      }));
      setPendingFile(null);
      setLabelModalOpen(false);
    }
  };

  const handleLabelCancel = () => {
    if (pendingFile?.preview && pendingFile.type === "VIDEO")
      URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
    setLabelModalOpen(false);
  };

  const handleMediaPreview = (media: any, isExisting: boolean = false) => {
    const mediaType = media.type === "VIDEO" ? "video" : "image";
    setPreviewModal({
      media: {
        ...media,
        url: isExisting ? media.url : media.preview,
        thumbnailUrl: media.thumbnailPreview || media.thumbnailUrl,
      },
      type: mediaType,
    });
  };

  const handleVideoPreview = (media: any, isExisting: boolean = false) => {
    setPreviewModal({
      media: {
        ...media,
        url: isExisting ? media.url : media.preview,
      },
      type: "video",
    });
  };

  const handleThumbnailPreview = (media: any) => {
    if (media.thumbnailPreview || media.thumbnailUrl) {
      setPreviewModal({
        media: {
          ...media,
          url: media.thumbnailPreview || media.thumbnailUrl,
          name: media.name ? `${media.name} - Thumbnail` : "Thumbnail",
        },
        type: "image",
      });
    }
  };

  const closePreviewModal = () => {
    setPreviewModal(null);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);

    try {
      if (deleteModal.type === "ticket" && deleteModal.item.id) {
        // Delete existing ticket type from backend
        await adminService.deleteTicketType(deleteModal.item.id);
      } else if (deleteModal.type === "media" && deleteModal.item.id) {
        // Delete existing media from backend
        await adminService.deleteMedia(deleteModal.item.id);
      }

      // Update frontend state after successful backend deletion
      if (deleteModal.type === "ticket") {
        const updatedFormData = {
          ...formData,
          ticket_types: formData.ticket_types.filter(
            (_, i) => i !== deleteModal.index,
          ),
        };
        setFormData(updatedFormData);
        setOriginalData(updatedFormData);
      } else if (deleteModal.type === "media") {
        if (deleteModal.isExisting) {
          setExistingMedia((prev) => {
            const updated = [...prev];
            updated.splice(deleteModal.index, 1);
            return updated;
          });
        } else {
          setFormData((prev) => {
            const updatedMedia = [...prev.mediaFiles];
            if (updatedMedia[deleteModal.index].type === "VIDEO")
              URL.revokeObjectURL(updatedMedia[deleteModal.index].preview);
            updatedMedia.splice(deleteModal.index, 1);
            return { ...prev, mediaFiles: updatedMedia };
          });
        }
        setOriginalData(formData);
      }

      // Close modal
      setDeleteModal({
        isOpen: false,
        type: "ticket",
        index: -1,
        isExisting: false,
        item: null,
      });
    } catch (error) {
      setError(`Failed to delete ${deleteModal.type}. Please try again.`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleteLoading) {
      setDeleteModal({
        isOpen: false,
        type: "ticket",
        index: -1,
        isExisting: false,
        item: null,
      });
    }
  };

  const handleVideoThumbnailUpload = async (videoIndex: number, file: File) => {
    if (!file) return;
    const tinyThumb = await getTinyPreview(file);
    setFormData((prev) => {
      const updatedMedia = [...prev.mediaFiles];
      if (updatedMedia[videoIndex]) {
        updatedMedia[videoIndex].thumbnailPreview = tinyThumb;
        updatedMedia[videoIndex].thumbnail = file; // Store the actual thumbnail file
        // Also update the main preview to show thumbnail in top-left
        updatedMedia[videoIndex].preview = tinyThumb;
      }
      return { ...prev, mediaFiles: updatedMedia };
    });
  };

  const removeMedia = (index: number, isExisting: boolean = false) => {
    const media = isExisting
      ? existingMedia[index]
      : formData.mediaFiles[index];
    setDeleteModal({
      isOpen: true,
      type: "media",
      index,
      isExisting,
      item: media,
    });
  };

  const addCategory = () => {
    if (!newTicket.category || isNaN(newTicket.price))
      return alert("Please provide at least a category and price");
    if (formData.ticket_types.some((tt) => tt.category === newTicket.category))
      return alert("Category already exists.");
    setFormData((p) => ({
      ...p,
      ticket_types: [...p.ticket_types, { ...newTicket }],
    }));
    setNewTicket({
      id: null,
      category: "ADULT",
      price: 0,
      maxQuantityPerBooking: 10,
    });
  };

  const removeTicketType = (index: number) => {
    if (formData.ticket_types.length > 0) {
      setDeleteModal({
        isOpen: true,
        type: "ticket",
        index,
        isExisting: false,
        item: formData.ticket_types[index],
      });
    }
  };

  const updateTicketType = (
    index: number,
    field: keyof CreateTicketTypeRequest,
    value: any,
  ) => {
    // Prevent duplicate ticket types - only 1 per category
    if (field === "category") {
      const categoryExists = formData.ticket_types.some(
        (tt, i) => tt.category === value && i !== index,
      );
      if (categoryExists) {
        setError(`A ${value.toUpperCase()} ticket type already exists`);
        setTimeout(() => setError(""), 3000);
        return;
      }
    }

    const updatedTicketTypes = [...formData.ticket_types];
    updatedTicketTypes[index] = {
      ...updatedTicketTypes[index],
      [field]: value,
    };
    setFormData((p) => ({ ...p, ticket_types: updatedTicketTypes }));
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure? This will permanently delete the event and all associated data.",
      )
    ) {
      try {
        await adminService.deleteEvent(eventId);
        router.push("/admin/events");
      } catch (error) {
        setError("Failed to delete event");
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    // Get only changed fields
    const payload: any = { productId: event.productId };

    // Add only changed event fields
    if (hasFieldChanged(originalData?.name, formData.name, "name")) {
      payload.name = formData.name;
    }
    if (
      hasFieldChanged(
        originalData?.description,
        formData.description,
        "description",
      )
    ) {
      payload.description = formData.description;
    }
    if (
      hasFieldChanged(originalData?.eventDate, formData.eventDate, "eventDate")
    ) {
      payload.eventDate = formData.eventDate;
    }
    if (
      hasFieldChanged(originalData?.startTime, formData.startTime, "startTime")
    ) {
      payload.startTime = formData.startTime;
    }
    if (hasFieldChanged(originalData?.endTime, formData.endTime, "endTime")) {
      payload.endTime = formData.endTime;
    }
    if (
      hasFieldChanged(originalData?.capacity, formData.capacity, "capacity")
    ) {
      payload.capacity = parseInt(formData.capacity, 10);
    }
    if (
      hasFieldChanged(originalData?.isActive, formData.isActive, "isActive")
    ) {
      payload.isActive = formData.isActive;
    }

    // Handle ticket types
    const ticketChanges = getTicketTypeChanges(
      originalData?.ticket_types,
      formData.ticket_types,
    );
    if (ticketChanges.length > 0) {
      payload.ticketTypes = ticketChanges;
    }

    // Check if any changes exist
    if (Object.keys(payload).length === 1 && formData.mediaFiles.length === 0) {
      // Only productId
      setError("No changes to save");
      setSubmitting(false);
      return;
    }

    try {
      // Update event details

      let media;
      // Upload new media files
      if (formData.mediaFiles.length > 0) {
        const data = new FormData();
        formData.mediaFiles.forEach((m: any, index: number) => {
          data.append("mediaFiles", m.file);
          data.append("label", m.label);

          // Named thumbnail per video index
          if (m.thumbnail) {
            data.append(`thumbnail_${index}`, m.thumbnail);
          }
        });
        media = await adminService.uploadProductMedia(data);
      }
      await adminService.updateEvent(eventId, {
        ...payload,
        mediaIds: media?.data?.mediaIds,
      });

      // Update original data after successful save
      setOriginalData(formData);

      router.push("/admin/events");
    } catch (error) {
      setError("Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

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
    <div className={`min-h-screen ${surface} pt-5 sm:pt-20`}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* ── Header ── */}
        <div className="flex justify-between gap-2 mb-8">
          <div className="flex items-baseline gap-4">
            <button
              onClick={() => router.push("/admin/events")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${d ? "hover:bg-white/8 text-white/50 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"}`}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${text}`}>
                Edit Event
              </h1>
              <p className={`text-sm ${muted} mt-0.5`}>{formData.name}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={handleDelete}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-red-500 hover:bg-red-600 text-white`}
            >
              <Trash2 size={16} className="inline mr-2" />
              Delete Event
            </button>
            <div>
              <select
                className={`px-3 py-2 rounded-xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent/50 ${inputBg} ${text}`}
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="UPCOMING">UPCOMING</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          {/* ══════════ LEFT COLUMN ══════════ */}
          <div className="space-y-7">
            {/* — Event Info — */}
            <div className={`p-6 rounded-3xl border ${border} ${card}`}>
              <div className="flex items-center gap-2 mb-6">
                <Calendar size={14} className={muted} />
                <h2
                  className={`text-sm font-bold uppercase tracking-wider ${muted}`}
                >
                  Event Details
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}
                  >
                    Event Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Festival 2025"
                    className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent/50 placeholder:${muted} ${inputBg} ${text}`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}
                  >
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what attendees can expect…"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent/50 resize-none placeholder:${muted} ${inputBg} ${text}`}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent/50 ${inputBg} ${text}`}
                      value={formData.eventDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eventDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}
                    >
                      Capacity
                    </label>
                    <input
                      type="number"
                      placeholder="500"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent/50 ${inputBg} ${text}`}
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent/50 ${inputBg} ${text}`}
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 border-transparent transition-all focus:border-accent/50 ${inputBg} ${text}`}
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* — Ticket Types — */}
            <div className={`p-6 rounded-3xl border ${border} ${card}`}>
              <div className="flex items-center gap-2 mb-6">
                <Tag size={14} className={muted} />
                <h2
                  className={`text-sm font-bold uppercase tracking-wider ${muted}`}
                >
                  Ticket Types
                </h2>
              </div>

              {/* Existing tickets */}
              {formData.ticket_types.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.ticket_types.map((tt, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${border} ${card}`}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wider border-2 border-transparent focus:border-accent/50 outline-none appearance-none cursor-pointer ${CATEGORY_COLORS[tt.category] ?? "bg-gray-500/10 text-gray-400"} ${inputBg} ${text} ${border}`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 4px center",
                            backgroundSize: "12px",
                            paddingRight: "20px",
                          }}
                        >
                          {tt.category}
                        </span>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tt.price}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                "price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={`w-20 px-2 py-1 text-xs rounded-lg ${inputBg} ${text} border ${border} focus:border-accent/50 outline-none`}
                            placeholder="Price"
                          />
                          <span className={`text-xs ${muted}`}>ETB</span>
                          <input
                            type="number"
                            min="1"
                            value={tt.maxQuantityPerBooking}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                "maxQuantityPerBooking",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className={`w-20 px-2 py-1 text-xs rounded-lg ${inputBg} ${text} border ${border} focus:border-accent/50 outline-none`}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeTicketType(index)}
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
                          disabled={formData.ticket_types.some(
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
                      className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-accent/50 transition-all ${inputBg} ${text}`}
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
                      className={`w-full pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-accent/50 transition-all ${inputBg} ${text}`}
                      value={newTicket.maxQuantityPerBooking}
                      onChange={(e) =>
                        setNewTicket({
                          ...newTicket,
                          maxQuantityPerBooking: parseInt(e.target.value),
                        })
                      }
                    />
                    <span
                      className={`absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wider ${muted} pointer-events-none`}
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
            </div>
          </div>

          {/* ══════════ RIGHT COLUMN ══════════ */}
          <div className="space-y-7">
            <div className={`p-6 rounded-3xl border ${border} ${card}`}>
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon size={14} className={muted} />
                <h2
                  className={`text-sm font-bold uppercase tracking-wider ${muted}`}
                >
                  Event Media
                </h2>
              </div>

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
              <div className="grid grid-cols-2 gap-3 mt-4">
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

              {/* Combined Media Grid */}
              <div className="mt-4">
                {/* Existing Media */}
                {existingMedia.length > 0 && (
                  <div className="mb-4">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider mb-3 ${muted}`}
                    >
                      Existing Media
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {existingMedia.map((media, idx) =>
                        media.type === "IMAGE" ? (
                          <div
                            key={`existing-${idx}`}
                            className="relative aspect-square rounded-xl overflow-hidden group shadow-sm cursor-pointer"
                            onClick={() => handleMediaPreview(media, true)}
                          >
                            <img
                              src={media.url}
                              className="w-full h-full object-cover"
                              alt="existing media"
                              crossOrigin="anonymous"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                            {/* Delete button only */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMedia(idx, true);
                              }}
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
                            key={`existing-${idx}`}
                            media={media}
                            index={idx}
                            isDarkTheme={d}
                            muted={muted}
                            onThumbnailUpload={async (index, file, preview) => {
                              setExistingMedia((prev) => {
                                const updated = [...prev];
                                if (updated[index]) {
                                  updated[index].thumbnailPreview = preview;
                                  updated[index].thumbnail = file;
                                  updated[index].hasChanges = true;
                                }
                                return updated;
                              });
                            }}
                            onThumbnailDelete={(index) => {
                              setExistingMedia((prev) => {
                                const updated = [...prev];
                                if (updated[index]) {
                                  updated[index].thumbnailPreview = undefined;
                                  updated[index].thumbnail = undefined;
                                  updated[index].hasChanges = true;
                                }
                                return updated;
                              });
                            }}
                            onRemoveMedia={(index) => removeMedia(index, true)}
                            onPreview={() => handleVideoPreview(media, true)}
                            onThumbnailPreview={() =>
                              handleThumbnailPreview(media)
                            }
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* New Media */}
                {formData.mediaFiles.length > 0 && (
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider mb-3 ${muted}`}
                    >
                      New Media
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {formData.mediaFiles.map((media, idx) =>
                        media.type === "IMAGE" ? (
                          <div
                            key={`new-${idx}`}
                            className="relative aspect-square rounded-xl overflow-hidden group shadow-sm cursor-pointer"
                            onClick={() => handleMediaPreview(media, false)}
                          >
                            <img
                              src={media.preview}
                              className="w-full h-full object-cover"
                              alt="new media"
                              crossOrigin="anonymous"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                            {/* Delete button only */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMedia(idx, false);
                              }}
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
                            key={`new-${idx}`}
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
                            onRemoveMedia={(index) => removeMedia(index, false)}
                            onPreview={() => handleVideoPreview(media, false)}
                            onThumbnailPreview={() =>
                              handleThumbnailPreview(media)
                            }
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}

                {existingMedia.length === 0 &&
                  formData.mediaFiles.length === 0 && (
                    <div
                      className={`flex flex-col items-center justify-center py-8 rounded-2xl ${d ? "bg-white/2" : "bg-black/2"}`}
                    >
                      <ImageIcon size={28} className={`${muted} mb-2`} />
                      <p className={`text-xs font-medium ${muted}`}>
                        No media added yet
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-between mt-8 p-6 rounded-3xl border ${border} ${card}">
          <button
            onClick={() => router.push("/admin/events")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${d ? "bg-white/6 hover:bg-white/10 text-white/70" : "bg-black/5 hover:bg-black/10 text-black/60"}`}
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className={`text-xs ${muted}`}>
              {formData.ticket_types.length} ticket type
              {formData.ticket_types.length !== 1 ? "s" : ""} ·{" "}
              {formData.mediaFiles.length + existingMedia.length} file
              {formData.mediaFiles.length + existingMedia.length !== 1
                ? "s"
                : ""}
            </span>
            <button
              disabled={submitting}
              onClick={handleUpdate}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black
                bg-linear-to-r from-accent to-accent2/80
                hover:from-accent2/90 hover:to-accent2/70
                shadow-lg shadow-accent/30
                transition-all active:scale-[0.98]
                ${submitting ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  Update Event <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Label picker modal ── */}
        {labelModalOpen && pendingFile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-60">
            <div
              className={`w-full max-w-sm mx-4 rounded-3xl shadow-2xl overflow-hidden border ${border} ${d ? "bg-[#141416]" : "bg-white"}`}
            >
              <div className={`px-6 pt-6 pb-4 border-b ${border}`}>
                <h3 className={`text-base font-bold ${text}`}>
                  Tag this image
                </h3>
                <p className={`text-xs mt-0.5 ${muted}`}>
                  Choose how this image will be used
                </p>
              </div>
              <div className="p-4">
                <img
                  src={pendingFile.preview}
                  className="w-full h-36 object-cover rounded-2xl mb-4"
                  alt="pending"
                  crossOrigin="anonymous"
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
                  onClick={handleLabelCancel}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${d ? "bg-white/6 hover:bg-white/10 text-white/50" : "bg-black/5 hover:bg-black/10 text-black/50"}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Preview Modal */}
        <AnimatePresence>
          {previewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
              onClick={closePreviewModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={closePreviewModal}
                  className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
                >
                  <X size={20} />
                </button>

                {/* Media content */}
                {previewModal.type === "image" ? (
                  <img
                    src={previewModal.media.url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <video
                    src={previewModal.media.url}
                    controls
                    autoPlay
                    crossOrigin="anonymous"
                    className="max-w-full max-h-full rounded-lg"
                  />
                )}

                {/* Media info */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold truncate">
                        {previewModal.media.name || "Media"}
                      </p>
                      <p className="text-sm opacity-80">
                        {previewModal.type.toUpperCase()}
                      </p>
                    </div>
                    {previewModal.media.label && (
                      <button
                        onClick={() =>
                          handleEditLabel(
                            previewModal.media,
                            previewModal.isExisting,
                          )
                        }
                        className="bg-accent hover:bg-accent/80 text-black px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                      >
                        {previewModal.media.label}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={`Delete ${deleteModal.type === "ticket" ? "Ticket Type" : "Media"}`}
          message={`Are you sure you want to delete this ${deleteModal.type === "ticket" ? "ticket type" : "media file"}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleteLoading}
          type="danger"
        />

        {/* Edit Label Modal */}
        <EditLabelModal />
      </div>
    </div>
  );
}
