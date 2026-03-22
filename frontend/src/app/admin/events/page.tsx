"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  X,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  ArrowUp,
  ImageIcon,
  Video,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { Event, CreateTicketTypeRequest, TicketType } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";

const EventsManagementPage = () => {
  const router = useRouter();
  const { isDarkTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    capacity: string;
    ticket_types: CreateTicketTypeRequest[];
    mediaFiles: {
      file: File;
      type: "IMAGE" | "VIDEO";
      name: string;
      url?: string;
      provider: string;
      preview: string;
    }[];
  }>({
    name: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    capacity: "",
    ticket_types: [],
    mediaFiles: [] as {
      file: File;
      type: "IMAGE" | "VIDEO";
      name: string;
      url?: string;
      provider: string;
      preview: string;
    }[],
  });
  const [newTicket, setNewTicket] = useState<CreateTicketTypeRequest>({
    name: "",
    category: "ADULT",
    price: 0,
    description: "",
    maxQuantityPerBooking: 10,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  // Apply filters whenever events, search, or status filter changes
  useEffect(() => {
    let filtered = events;

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((event) => {
        if (statusFilter === "ACTIVE") {
          return event.is_active === true;
        } else if (statusFilter === "INACTIVE") {
          return event.is_active === false;
        }
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, statusFilter]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllEvents(1, 50);
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Failed to load events:", error);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Create a FormData instance
    const data = new FormData();

    // 2. Append the basic event data as a stringified JSON
    // (Or append them individually if your backend prefers)
    const payload = {
      name: formData.name,
      description: formData.description,
      eventDate: formData.eventDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      capacity: parseInt(formData.capacity, 10),
      ticketTypes: formData.ticket_types.map((tt) => ({
        ...tt,
        price: parseFloat(tt.price.toString()),
      })),
    };

    try {
      // 4. Pass the FormData object to your service
      const response = await adminService.createEvent(payload);
      const newProductId = response.data?.productId;

      if (formData.mediaFiles.length > 0 && newProductId) {
        const pureFiles = formData.mediaFiles.map((m) => m.file);
        console.log(pureFiles);
        await adminService.uploadProductMedia(newProductId, pureFiles);
      }

      // Refresh and Reset
      loadEvents();
      setFormData({
        name: "",
        description: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        capacity: "",
        ticket_types: [],
        mediaFiles: [], // Clear the files
      });

      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Failed to create event:", error);
      // Add a toast or notification here for the user
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: boolean) => {
    try {
      await adminService.updateEvent(eventId, { isActive: newStatus });
      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, is_active: newStatus } : event,
        ),
      );
    } catch (error) {
      console.error("Failed to update event status:", error);
    }
  };

  const addCategory = () => {
    if (!newTicket.name || newTicket.price == null || isNaN(newTicket.price)) {
      alert("Please provide at least a name and price");
      return;
    }

    const isDuplicate = formData.ticket_types.some(
      (tt) => tt.category === newTicket.category,
    );

    if (isDuplicate) {
      alert(
        `A ticket for the "${newTicket.category}" category already exists. Please edit the existing one or choose a different category.`,
      );
      return;
    }

    setFormData({
      ...formData,
      ticket_types: [...formData.ticket_types, { ...newTicket }],
    });

    setNewTicket({
      name: "",
      category: "ADULT",
      price: 0,
      description: "",
      maxQuantityPerBooking: 10,
    });
  };

  const removeCategory = (index: number) => {
    const updated = formData.ticket_types.filter((_, i) => i !== index);
    setFormData({ ...formData, ticket_types: updated });
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this event?")) return;

    try {
      await adminService.deleteEvent(id);
      await loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  // UI state for status styling
  const statusConfig = (isDarkTheme: boolean) => ({
    active: {
      bg: isDarkTheme ? "bg-green-900/50" : "bg-green-50",
      text: isDarkTheme ? "text-green-400" : "text-green-700",
      icon: <CheckCircle2 size={14} />,
      label: "ACTIVE",
    },
    inactive: {
      bg: isDarkTheme ? "bg-red-900/50" : "bg-red-50",
      text: isDarkTheme ? "text-red-400" : "text-red-700",
      icon: <AlertTriangle size={14} />,
      label: "INACTIVE",
    },
  });

  const handleMediaUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "IMAGE" | "VIDEO",
    name: string,
    url: string,
    provider: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newMedia = {
      file,
      type,
      name,
      url,
      provider,
      preview: URL.createObjectURL(file),
    };

    setFormData((prev) => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, newMedia],
    }));
  };

  const removeMedia = (index: number) => {
    setFormData((prev) => {
      const updatedMedia = [...prev.mediaFiles];
      // Free memory by revoking the object URL
      URL.revokeObjectURL(updatedMedia[index].preview);
      updatedMedia.splice(index, 1);
      return { ...prev, mediaFiles: updatedMedia };
    });
  };

  return (
    <div
      className={`min-h-screen p-8 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"}`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1
            className={`text-3xl font-black tracking-tight ${isDarkTheme ? "text-white" : "text-slate-900"}`}
          >
            Park Events
          </h1>
          <p
            className={`font-medium ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}
          >
            Manage special events, pricing, and scheduling
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex items-center justify-center gap-2 ${isDarkTheme ? "bg-indigo-600" : "bg-gray-800"} hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold  transition-all active:scale-95`}
        >
          <Plus size={20} />
          <span>Add New Event</span>
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
          {[
            {
              label: "Active Events",
              value: events.filter((e) => e.is_active).length.toString(),
              icon: <Activity />,
              color: "text-green-600",
            },
            {
              label: "Inactive Events",
              value: events.filter((e) => !e.is_active).length.toString(),
              icon: <AlertTriangle />,
              color: "text-red-600",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border shadow-sm ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`${stat.color} bg-opacity-10 p-2 rounded-lg`}>
                  {stat.icon}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                >
                  {stat.label}
                </span>
              </div>
              <div
                className={`text-2xl font-black ${isDarkTheme ? "text-white" : "text-slate-800"}`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ANALYTICS BUTTON - Far Right of Page */}
        <div className="flex items-end">
          <Link
            href="/admin/analitics/events"
            className={`group flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              isDarkTheme
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 hover:from-indigo-700 hover:to-purple-700"
                : "bg-gradient-to-r from-blue-500 to-purple-500 border-blue-400 hover:from-blue-600 hover:to-purple-600"
            } text-white font-bold shadow-lg`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>View Analytics</span>
            <ArrowUp className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div
        className={`p-4 rounded-2xl border shadow-sm mb-6 flex items-center gap-4 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-slate-100"}`}
      >
        <div className="relative flex-1">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
            size={18}
          />
          <input
            type="text"
            placeholder="Search by event name or description..."
            className={`w-full pl-12 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50"}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium min-w-40
            ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50"}`}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* EVENTS GRID */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              Loading events...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => router.push(`/admin/events/${event.id}`)}
              className={`group relative rounded-3xl border shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer ${
                isDarkTheme
                  ? "bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border-slate-200"
              }`}
            >
              {/* Gradient Overlay on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative p-8">
                <div className="flex justify-between items-start mb-6">
                  {/* Status chip with enhanced styling */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${
                      statusConfig(isDarkTheme)[
                        event.is_active ? "active" : "inactive"
                      ]?.bg
                    } ${statusConfig(isDarkTheme)[event.is_active ? "active" : "inactive"]?.text}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                    {
                      statusConfig(isDarkTheme)[
                        event.is_active ? "active" : "inactive"
                      ]?.label
                    }
                  </div>

                  {/* Hover actions: status dropdown, delete */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    {/* Status Dropdown */}
                    <select
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border outline-none cursor-pointer shadow-sm transition-all ${
                        isDarkTheme
                          ? "bg-gray-900 text-white border-gray-600"
                          : "bg-gray-800 text-white border-gray-600"
                      }`}
                      value={event.is_active ? "ACTIVE" : "INACTIVE"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(
                          event.id,
                          e.target.value === "ACTIVE",
                        );
                      }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>

                    {/* Delete Button */}
                    <button
                      className={`p-2 rounded-xl shadow-sm transition-all hover:shadow-md hover:scale-105 ${
                        isDarkTheme
                          ? "text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                          : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3
                  className={`text-2xl font-black mb-6 bg-gradient-to-r ${
                    isDarkTheme
                      ? "from-white to-gray-300"
                      : "from-slate-900 to-slate-700"
                  } bg-clip-text text-transparent`}
                >
                  {event.name}
                </h3>

                {/* Action Button with enhanced styling */}
                <div
                  className={`flex justify-end border-t pt-6 ${
                    isDarkTheme ? "border-gray-700/50" : "border-slate-200/50"
                  }`}
                >
                  <Link
                    href={`/admin/analitics/events/${event.id}`}
                    className={`group/btn relative px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      isDarkTheme
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                        : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="relative z-10">View Statistics</span>
                    {/* Button shine effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SLIDE-OVER DRAWER (ADD/EDIT FORM) */}
      {isDrawerOpen && (
        <>
          <div
            className={`fixed inset-0 backdrop-blur-sm z-40 ${isDarkTheme ? "bg-black/50" : "bg-slate-900/40"}`}
            onClick={() => setIsDrawerOpen(false)}
          />
          <div
            className={`fixed right-0 top-0 h-full w-full max-w-lg z-50 shadow-2xl animate-in slide-in-from-right duration-300 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-white"}`}
          >
            <div className="p-8 h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={handleCreate}
                  className={`w-full text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all transform active:scale-[0.98] ${isDarkTheme ? "bg-indigo-600" : "bg-slate-900"}`}
                >
                  Create Event
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className={`p-2 rounded-full text-slate-400 ${isDarkTheme ? "hover:bg-gray-800" : "hover:bg-slate-100"}`}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="space-y-6 overflow-y-auto flex-1 pr-2 pb-4 custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                    >
                      Event Name
                    </label>
                    <input
                      type="text"
                      className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                      placeholder="e.g. Summer Festival"
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
                      className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium min-h-[80px] ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                      placeholder="Event description..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                      >
                        Event Date
                      </label>
                      <input
                        type="date"
                        className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                        value={formData.eventDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eventDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                      >
                        Capacity
                      </label>
                      <input
                        type="number"
                        className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                        placeholder="500"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                      >
                        Start Time
                      </label>
                      <input
                        type="time"
                        className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                      >
                        End Time
                      </label>
                      <input
                        type="time"
                        className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold ${isDarkTheme ? "bg-bg3 text-white focus:bg-gray-700" : "bg-slate-50 focus:bg-white"}`}
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* DYNAMIC PRICING MATRIX */}
                <div className="space-y-6">
                  {/* --- 1. DISPLAY ADDED CATEGORIES --- */}
                  {formData.ticket_types.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.ticket_types.map((tt, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-indigo-100"}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${isDarkTheme ? "bg-gray-700 text-white" : "bg-indigo-50"}`}
                                style={{ color: "var(--accent)" }}
                              >
                                {tt.category}
                              </span>
                              <h4
                                className={`text-sm font-bold ${isDarkTheme ? "text-gray-300" : "text-slate-800"}`}
                              >
                                {tt.name}
                              </h4>
                            </div>
                            <p
                              className={`text-xs font-medium ${isDarkTheme ? "text-gray-500" : "text-slate-500"}`}
                            >
                              {tt.price} ETB
                            </p>
                          </div>
                          <button
                            onClick={() => removeCategory(index)}
                            className={`p-2 text-slate-300 hover:text-red-500 rounded-xl transition-all ${isDarkTheme ? "hover:bg-red-900/50" : "hover:bg-red-50"}`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* --- 2. THE ENTRY FORM --- */}
                  <div
                    className={`p-6 rounded-[32px] border-2 border-dashed space-y-4 ${isDarkTheme ? "bg-bg3 border-gray-600" : "bg-slate-50 border-slate-200"}`}
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
                        Add New Ticket Category
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                          Ticket Name
                        </label>
                        <input
                          placeholder="e.g., Adult Ticket"
                          className={`w-full p-3 rounded-xl border focus:border-indigo-500 outline-none font-bold text-sm ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`}
                          value={newTicket.name}
                          onChange={(e) =>
                            setNewTicket({ ...newTicket, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                          Category
                        </label>
                        <select
                          className={`w-full p-3 rounded-xl border focus:border-indigo-500 outline-none font-bold text-sm appearance-none ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`}
                          value={newTicket.category}
                          onChange={(e) =>
                            setNewTicket({
                              ...newTicket,
                              category: e.target.value as
                                | "ADULT"
                                | "CHILD"
                                | "SENIOR"
                                | "STUDENT"
                                | "GROUP",
                            })
                          }
                        >
                          {["adult", "child", "senior", "student", "group"].map(
                            (cat) => {
                              const isAlreadyAdded = formData.ticket_types.some(
                                (tt) => tt.category === cat,
                              );
                              return (
                                <option
                                  key={cat}
                                  value={cat}
                                  disabled={isAlreadyAdded}
                                >
                                  {cat.charAt(0).toUpperCase() + cat.slice(1)}{" "}
                                  {isAlreadyAdded ? "(Added)" : ""}
                                </option>
                              );
                            },
                          )}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                          Price (ETB)
                        </label>
                        <input
                          type="number"
                          placeholder="0.0"
                          className={`w-full p-3 rounded-xl border focus:border-indigo-500 outline-none font-black text-sm ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`}
                          value={newTicket.price || ""}
                          onChange={(e) =>
                            setNewTicket({
                              ...newTicket,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                          Max Qty
                        </label>
                        <input
                          type="number"
                          className={`w-full p-3 rounded-xl border focus:border-indigo-500 outline-none font-bold text-sm ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`}
                          value={newTicket.maxQuantityPerBooking}
                          onChange={(e) =>
                            setNewTicket({
                              ...newTicket,
                              maxQuantityPerBooking:
                                parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                        Description
                      </label>
                      <textarea
                        placeholder="Short description for the customer..."
                        rows={2}
                        className={`w-full p-3 rounded-xl border focus:border-indigo-500 outline-none text-sm ${isDarkTheme ? "bg-bg3 text-white border-gray-600" : "bg-white border-slate-200"}`}
                        value={newTicket.description}
                        onChange={(e) =>
                          setNewTicket({
                            ...newTicket,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={addCategory}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors  ${isDarkTheme ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                    >
                      Add Category to List
                    </button>
                  </div>
                </div>
                {/* MEDIA UPLOAD SECTION */}
                <div className="space-y-4">
                  <label
                    className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? "text-gray-500" : "text-slate-400"}`}
                  >
                    Event Media (Images & Video)
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Image Upload Button */}
                    <label
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[24px] cursor-pointer transition-all hover:border-indigo-500 ${isDarkTheme ? "bg-bg3 border-gray-700" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="p-3 bg-indigo-500/10 rounded-xl mb-2">
                        <ImageIcon size={20} className="text-indigo-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-indigo-500">
                        Add Image
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleMediaUpload(e, "IMAGE")}
                      />
                    </label>

                    {/* Video Upload Button */}
                    <label
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[24px] cursor-pointer transition-all hover:border-indigo-500 ${isDarkTheme ? "bg-bg3 border-gray-700" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="p-3 bg-amber-500/10 rounded-xl mb-2">
                        <Video size={20} className="text-amber-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-amber-500">
                        Add Video
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={(e) => handleMediaUpload(e, "VIDEO")}
                      />
                    </label>
                  </div>

                  {/* Media Previews */}
                  {formData.mediaFiles.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
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
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                              <Video size={24} className="text-white/50" />
                            </div>
                          )}
                          <button
                            onClick={() => removeMedia(idx)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-white font-bold uppercase">
                            {media.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventsManagementPage;
