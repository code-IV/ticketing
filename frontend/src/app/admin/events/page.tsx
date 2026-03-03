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
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { Event, CreateTicketTypeRequest, TicketType } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const EventsManagementPage = () => {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    capacity: string;
    ticket_types: CreateTicketTypeRequest[];
  }>({
    name: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    capacity: "",
    ticket_types: [],
  });
  const [newTicket, setNewTicket] = useState<CreateTicketTypeRequest>({
    name: "",
    category: "adult",
    price: 0,
    description: "",
    maxQuantityPerBooking: 10,
  });

  useEffect(() => {
    loadEvents();
  }, []);

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
      await adminService.createEventWithTicketTypes(payload);
      loadEvents();

      setFormData({
        name: "",
        description: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        capacity: "",
        ticket_types: [],
      });

      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Failed to create event:", error);
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
      category: "adult",
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
  const statusConfig = {
    active: {
      bg: "bg-green-50",
      text: "text-green-700",
      icon: <CheckCircle2 size={14} />,
      label: "ACTIVE",
    },
    inactive: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <AlertTriangle size={14} />,
      label: "INACTIVE",
    },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Park Events
          </h1>
          <p className="text-slate-500 font-medium">
            Manage special events, pricing, and scheduling
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center justify-center gap-2 style={{ backgroundColor: 'var(--accent)' }} hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Add New Event</span>
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: "Active Events",
            value: events.filter(e => e.is_active).length.toString(),
            icon: <Activity />,
            color: "text-green-600",
          },
          {
            label: "Upcoming",
            value: events.filter(e => new Date(e.event_date) > new Date()).length.toString(),
            icon: <Calendar />,
            color: "style={{ color: 'var(--accent)' }}",
          },
          {
            label: "Total Attendees",
            value: events.reduce((sum, e) => sum + e.tickets_sold, 0).toString(),
            icon: <Users />,
            color: "style={{ color: 'var(--accent)' }}",
          },
          {
            label: "ANALYTICS",
            value: "",
            icon: <BarChart3 />,
            color: "style={{ color: 'var(--accent)' }}",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`${stat.color} bg-opacity-10 p-2 rounded-lg`}>
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by event name or description..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* EVENTS GRID */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events
            .filter(event => 
              searchQuery === "" || 
              event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              event.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((event) => (
            <div
              key={event.id}
              onClick={() => router.push(`/admin/events/${event.id}`)}
              className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  {/* Status chip */}
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[event.is_active ? 'active' : 'inactive']?.bg} ${statusConfig[event.is_active ? 'active' : 'inactive']?.text}`}
                  >
                    {statusConfig[event.is_active ? 'active' : 'inactive']?.icon}
                    {statusConfig[event.is_active ? 'active' : 'inactive']?.label}
                  </div>

                  {/* Hover actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-1">
                  {event.name}
                </h3>
                
                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} />
                    <span>{format(new Date(event.event_date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={14} />
                    <span>{event.start_time} - {event.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users size={14} />
                    <span>{event.tickets_sold} / {event.capacity} attendees</span>
                  </div>
                </div>

                <p className="text-slate-400 text-sm mb-6 font-medium line-clamp-2">
                  {event.description}
                </p>

                <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Starting From
                    </span>
                    <div className="text-2xl font-black style={{ color: 'var(--accent)' }}">
                      {event.ticket_types && event.ticket_types.length > 0
                        ? Math.min(...event.ticket_types.map(t => t.price))
                        : "—"}
                      <span className="text-xs ml-1">ETB</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Analytics
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-8 h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={handleCreate}
                  className="w-full style={{ backgroundColor: 'var(--accent)' }} text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-[0.98]"
                >
                  Create Event
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="space-y-6 overflow-y-auto flex-1 pr-2 pb-4 custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Event Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                      placeholder="e.g. Summer Festival"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Description
                    </label>
                    <textarea
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium min-h-[80px]"
                      placeholder="Event description..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Event Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                        value={formData.eventDate}
                        onChange={(e) =>
                          setFormData({ ...formData, eventDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Capacity
                      </label>
                      <input
                        type="number"
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Start Time
                      </label>
                      <input
                        type="time"
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({ ...formData, startTime: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        End Time
                      </label>
                      <input
                        type="time"
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold"
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
                          className="flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-50 style={{ color: 'var(--accent)' }} text-[10px] font-black uppercase rounded-md">
                                {tt.category}
                              </span>
                              <h4 className="text-sm font-bold text-slate-800">
                                {tt.name}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {tt.price} ETB
                            </p>
                          </div>
                          <button
                            onClick={() => removeCategory(index)}
                            className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* --- 2. THE ENTRY FORM --- */}
                  <div className="p-6 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 style={{ backgroundColor: 'var(--accent)' }} rounded-lg">
                        <Plus size={16} className="text-white" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
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
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm"
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
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm appearance-none"
                          value={newTicket.category}
                          onChange={(e) =>
                            setNewTicket({
                              ...newTicket,
                              category: e.target.value as
                                | "adult"
                                | "student"
                                | "child"
                                | "group"
                                | "senior",
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
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-black text-sm"
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
                          className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm"
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
                        className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm"
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
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:style={{ backgroundColor: 'var(--accent)' }} transition-colors shadow-lg shadow-slate-200"
                    >
                      Add Category to List
                    </button>
                  </div>
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
