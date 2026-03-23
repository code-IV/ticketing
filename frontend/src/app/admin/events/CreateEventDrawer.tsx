"use client";
import React, { useState } from "react";
import { X, Plus, ImageIcon, Video } from "lucide-react";
import { adminService } from "@/services/adminService";
import { CreateTicketTypeRequest } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

const getTinyPreview = (file: File): Promise<string> => new Promise((res) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 300;
      canvas.height = (img.height / img.width) * 300;
      ctx?.drawImage(img, 0, 0, 300, canvas.height);
      res(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
});

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

const CreateEventDrawer = ({ isOpen, onClose, onSuccess }: Props) => {
  const { isDarkTheme } = useTheme();
  const [loading, setLoading] = useState(false); // FIXED: Added loading state
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "", description: "", eventDate: "", startTime: "", endTime: "", capacity: "",
    ticket_types: [] as CreateTicketTypeRequest[],
    mediaFiles: [] as any[],
  });

  const [newTicket, setNewTicket] = useState<CreateTicketTypeRequest>({
    name: "", category: "ADULT", price: 0, description: "", maxQuantityPerBooking: 10,
  });

  const getPosterCount = () => formData.mediaFiles.filter(m => m.type === "IMAGE" && m.label === "poster").length;
  const getBannerCount = () => formData.mediaFiles.filter(m => m.type === "IMAGE" && m.label === "banner").length;
  const getVideoCount = () => formData.mediaFiles.filter(m => m.type === "VIDEO").length;
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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "IMAGE" | "VIDEO") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = type === "IMAGE" ? await getTinyPreview(file) : URL.createObjectURL(file);
    const newMedia = { file, type, name: "", url: "", provider: "", preview };

    if (type === "IMAGE") {
      if (isGalleryOnly()) {
        setFormData(p => ({ ...p, mediaFiles: [...p.mediaFiles, { ...newMedia, label: "gallery" }] }));
      } else {
        setPendingFile(newMedia);
        setLabelModalOpen(true);
      }
    } else {
      setFormData(p => ({ ...p, mediaFiles: [...p.mediaFiles, newMedia] }));
    }
  };

  const handleLabelSelect = (label: "banner" | "poster" | "gallery") => {
    if (pendingFile) {
      setFormData(p => ({ ...p, mediaFiles: [...p.mediaFiles, { ...pendingFile, label }] }));
      setPendingFile(null);
      setLabelModalOpen(false);
    }
  };

  const handleLabelCancel = () => {
    if (pendingFile?.preview && pendingFile.type === "VIDEO") URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
    setLabelModalOpen(false);
  };

  // FIXED: Now async to prevent thumbnail memory leaks
  const handleVideoThumbnailUpload = async (videoIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tinyThumb = await getTinyPreview(file); // Use helper for thumbnail too
    setFormData((prev) => {
      const updatedMedia = [...prev.mediaFiles];
      if (updatedMedia[videoIndex]) updatedMedia[videoIndex].thumbnailPreview = tinyThumb;
      return { ...prev, mediaFiles: updatedMedia };
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

  const addCategory = () => {
    if (!newTicket.name || isNaN(newTicket.price)) return alert("Please provide at least a name and price");
    if (formData.ticket_types.some(tt => tt.category === newTicket.category)) return alert("Category already exists.");
    setFormData(p => ({ ...p, ticket_types: [...p.ticket_types, { ...newTicket }] }));
    setNewTicket({ name: "", category: "ADULT", price: 0, description: "", maxQuantityPerBooking: 10 });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // FIXED: Prevent double submissions
    
    setLoading(true);
    const payload = {
      name: formData.name,
      description: formData.description,
      eventDate: formData.eventDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      capacity: parseInt(formData.capacity, 10),
      ticketTypes: formData.ticket_types.map(tt => ({ ...tt, price: parseFloat(tt.price.toString()) })),
    };

    try {
      const response = await adminService.createEvent(payload);
      const newProductId = response.data?.productId;
      if (formData.mediaFiles.length > 0 && newProductId) {
        const pureFiles = formData.mediaFiles.map((m: any) => m.file);
        await adminService.uploadProductMedia(newProductId, pureFiles);
      }
      
      // FIXED: Clear data on success
      setFormData({ name: "", description: "", eventDate: "", startTime: "", endTime: "", capacity: "", ticket_types: [], mediaFiles: [] });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create event:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 backdrop-blur-sm z-40 ${isDarkTheme ? "bg-black/50" : "bg-slate-900/40"}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-lg z-50 shadow-2xl animate-in slide-in-from-right duration-300 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-white"}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <button 
              disabled={loading} // FIXED: Disable button while loading
              onClick={handleCreate} 
              className={`w-full text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkTheme ? "bg-indigo-600" : "bg-slate-900"}`}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
            <button onClick={onClose} className="p-2 ml-4 text-slate-400 hover:bg-gray-800 rounded-full"><X size={24} /></button>
          </div>

          <div className="space-y-6 overflow-y-auto flex-1 px-2 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}>Event Name</label>
                <input type="text" className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`} placeholder="e.g. Summer Festival" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}>Description</label>
                <textarea className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium min-h-[80px] ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`} placeholder="Event description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500">Event Date</label>
                  <input type="date" className={`w-full p-4 rounded-2xl ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50"}`} value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500">Capacity</label>
                  <input type="number" className={`w-full p-4 rounded-2xl ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50"}`} placeholder="500" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="time" className={`p-4 rounded-2xl ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50"}`} value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                <input type="time" className={`p-4 rounded-2xl ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50"}`} value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
              </div>
            </div>

            <div className="space-y-6">
              {formData.ticket_types.map((tt, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-2xl shadow-sm ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-indigo-100"}`}>
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-indigo-50 text-indigo-600">{tt.category}</span>
                    <h4 className={`text-sm font-bold ${isDarkTheme ? "text-gray-300" : "text-slate-800"}`}>{tt.name}</h4>
                    <p className="text-xs font-medium text-gray-500">{tt.price} ETB</p>
                  </div>
                  <button onClick={() => setFormData(p => ({ ...p, ticket_types: p.ticket_types.filter((_, i) => i !== index) }))} className="p-2 text-red-500"><X size={18} /></button>
                </div>
              ))}

              <div className={`p-6 rounded-[32px] border-2 border-dashed ${isDarkTheme ? "bg-bg3 border-gray-600" : "bg-slate-50 border-slate-200"}`}>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Ticket Name" className={`p-3 rounded-xl border ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`} value={newTicket.name} onChange={e => setNewTicket({...newTicket, name: e.target.value})} />
                  <select className={`p-3 rounded-xl border ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`} value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value as any})}>
                    {["adult", "child", "senior", "student", "group"].map(cat => (
                      <option key={cat} value={cat.toUpperCase()} disabled={formData.ticket_types.some(tt => tt.category === cat.toUpperCase())}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Price" className={`p-3 rounded-xl border ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`} value={newTicket.price || ""} onChange={e => setNewTicket({...newTicket, price: parseFloat(e.target.value) || 0})} />
                  <input type="number" className={`p-3 rounded-xl border ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`} value={newTicket.maxQuantityPerBooking} onChange={e => setNewTicket({...newTicket, maxQuantityPerBooking: parseInt(e.target.value)})} />
                </div>
                <textarea placeholder="Description" rows={2} className={`w-full mt-4 p-3 rounded-xl border ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white"}`} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} />
                <button type="button" onClick={addCategory} className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase">Add Category to List</button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-500">Event Media (Images & Video)</label>
              <div className={`p-3 rounded-xl grid grid-cols-3 text-center text-xs font-bold ${isDarkTheme ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                <div className={getPosterCount() >= 3 ? "text-green-500" : ""}>Poster ({getPosterCount()}/3)</div>
                <div className={getBannerCount() >= 3 ? "text-green-500" : ""}>Banner ({getBannerCount()}/3)</div>
                <div className={getVideoCount() >= 3 ? "text-green-500" : ""}>Video ({getVideoCount()}/3)</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[24px] cursor-pointer ${isDarkTheme ? "bg-bg3 border-gray-700" : "bg-slate-50"}`}>
                  <ImageIcon size={20} className="text-accent2 mb-2" />
                  <span className="text-[10px] font-black text-accent2">Add Image</span>
                  <input type="file" hidden accept="image/*" onChange={(e) => handleMediaUpload(e, "IMAGE")} />
                </label>
                {hasVideoSlot() && (
                  <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[24px] cursor-pointer ${isDarkTheme ? "bg-bg3 border-gray-700" : "bg-slate-50"}`}>
                    <Video size={20} className="text-indigo-500 mb-2" />
                    <span className="text-[10px] font-black text-indigo-500">Add Video</span>
                    <input type="file" hidden accept="video/*" onChange={(e) => handleMediaUpload(e, "VIDEO")} />
                  </label>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {formData.mediaFiles.map((media, idx) => (
                  <div key={idx} className="relative min-w-[120px] h-32 rounded-2xl overflow-hidden group shadow-md">
                    {media.type === "IMAGE" ? (
                      <img src={media.preview} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                        <Video size={24} className="text-white/50" />
                        <label className="absolute bottom-2 right-2 p-1 bg-green-500 rounded-full cursor-pointer">
                          <ImageIcon size={10} className="text-white" />
                          <input type="file" hidden accept="image/*" onChange={(e) => handleVideoThumbnailUpload(idx, e)} />
                        </label>
                        {/* FIXED: Using thumbnailPreview string instead of creating Object URL here */}
                        {media.thumbnailPreview && <div className="absolute top-2 left-2 w-8 h-8 rounded border-2 border-green-400 overflow-hidden"><img src={media.thumbnailPreview} className="object-cover" alt="thumb" /></div>}
                      </div>
                    )}
                    <button onClick={() => removeMedia(idx)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={14} /></button>
                    <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-green-600 font-bold">
                      {media.type} {media.label && `• ${media.label}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {labelModalOpen && pendingFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className={`w-full max-w-md p-6 rounded-2xl ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"}`}>
            <h3 className="text-lg font-bold mb-4">Select Image Label</h3>
            <img src={pendingFile.preview} className="w-full h-32 object-cover rounded-lg mb-4" alt="pending" />
            <div className="grid grid-cols-2 gap-3">
              {getAvailableImageLabels().map(label => (
                <button key={label} onClick={() => handleLabelSelect(label)} className="p-3 border-2 rounded-xl text-accent font-bold uppercase text-xs hover:border-accent2 transition-all">{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateEventDrawer;