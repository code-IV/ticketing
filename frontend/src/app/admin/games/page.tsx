"use client";
import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Settings,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Activity,
  Map,
  DollarSign,
  Divide,
  BarChart3,
} from "lucide-react";
import { gameService } from "@/services/adminService";
import { Game, CreateTicketTypeRequest, TicketType } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from '@/contexts/ThemeContext';

const GamesManagementPage = () => {
  const router = useRouter();
  const { isDarkTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    rules: string;
    status: "OPEN" | "ON_MAINTENANCE" | "UPCOMING" | "CLOSED";
    ticket_types: CreateTicketTypeRequest[];
  }>({
    name: "",
    description: "",
    rules: "",
    status: "OPEN",
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
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await gameService.getAll();
      setGames(response.data || []);
    } catch (error) {
      console.error("Failed to load games:", error);
      setError("Failed to load games. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description,
      rules: formData.rules,
      status: formData.status,
      ticket_types: formData.ticket_types,
    };

    try {
      await gameService.createGame(payload);
      loadGames();

      setFormData({
        name: "",
        description: "",
        rules: "",
        status: "OPEN",
        ticket_types: [],
      });

      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Failed to create game:", error);
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

  const statusConfig = (isDarkTheme: boolean) => ({
    OPEN: {
      bg: isDarkTheme ? "bg-green-900/50" : "bg-green-50",
      text: isDarkTheme ? "text-green-400" : "text-green-700",
      icon: <CheckCircle2 size={14} />,
      label: "OPEN",
    },
    ON_MAINTENANCE: {
      bg: isDarkTheme ? "bg-orange-900/50" : "bg-orange-50",
      text: isDarkTheme ? "text-orange-400" : "text-orange-700",
      icon: <Settings size={14} />,
      label: "ON MAINTENANCE",
    },
    UPCOMING: {
      bg: isDarkTheme ? "bg-blue-900/50" : "bg-blue-50",
      text: isDarkTheme ? "text-blue-400" : "text-blue-700",
      icon: <Clock size={14} />,
      label: "COMING SOON",
    },
    CLOSED: {
      bg: isDarkTheme ? "bg-red-900/50" : "bg-red-50",
      text: isDarkTheme ? "text-red-400" : "text-red-700",
      icon: <AlertTriangle size={14} />,
      label: "CLOSED",
    },
  });

  return (
    <div className={`min-h-screen p-8 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-[#F8FAFC]'}`}>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Park Attractions
          </h1>
          <p className={`font-medium ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
            Manage rides, pricing, and operational status
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex items-center justify-center gap-2 ${isDarkTheme? "bg-indigo-600" : "bg-gray-800"} hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95`}
        >
          <Plus size={20} />
          <span>Add New Game</span>
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: "Active Rides",
            value: "18",
            icon: <Activity />,
            color: "text-green-600",
          },
          {
            label: "Under Repair",
            value: "2",
            icon: <Settings />,
            color: "text-orange-600",
          },
          {
            label: "CLOSED",
            value: "5",
            icon: <AlertTriangle />,
            color: "text-red-600",
          },
          {
            label: "ANALYTICS",
            value: "",
            icon: <BarChart3 />,
            color: "text-yellow-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`${stat.color} bg-opacity-10 p-2 rounded-lg`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                {stat.label}
              </span>
            </div>
            <div className={`text-2xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className={`p-4 rounded-2xl border shadow-sm mb-6 flex items-center gap-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}>
        <div className="relative flex-1">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? 'text-white' : 'text-slate-400'}`}
            size={18}
          />
          <input
            type="text"
            placeholder="Search by ride name"
            className={`w-full pl-12 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-accent2 outline-none font-medium 
              ${isDarkTheme ? 'bg-bg3 text-white placeholder-gray-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* GAMES GRID */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Loading games...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => router.push(`/admin/games/${game.id}`)}
              className={`group rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  {/* Status chip (always visible) */}
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig(isDarkTheme)[game.status]?.bg} ${statusConfig(isDarkTheme)[game.status]?.text}`}
                  >
                    {statusConfig(isDarkTheme)[game.status]?.icon}
                    {statusConfig(isDarkTheme)[game.status]?.label}
                  </div>

                  {/* Hover actions: status dropdown, edit, delete */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Status Dropdown */}
                    <select
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border-none outline-none cursor-pointer ${statusConfig(isDarkTheme)[game.status]?.bg} ${statusConfig(isDarkTheme)[game.status]?.text}`}
                      value={game.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => e.stopPropagation()}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ON_MAINTENANCE">MAINTENANCE</option>
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>

                    {/* Delete Button */}
                    <button
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-red-600 ${isDarkTheme ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className={`text-xl font-black mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                  {game.name}
                </h3>
                <div className={`mt-4 space-y-2 border-t pt-4 ${isDarkTheme ? 'border-gray-700' : 'border-slate-50'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                    Pricing Matrix
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {game.ticket_types && game.ticket_types.length > 0 ? (
                      game.ticket_types.map((tt) => (
                        <div
                          key={tt.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDarkTheme ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-100'}`}
                        >
                          <span className={`text-[10px] font-bold uppercase ${isDarkTheme ? 'text-white' : 'text-accent2'}`}>
                            {tt.category}
                          </span>
                          <span className={`text-sm font-black ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>
                            {tt.price} <span className="text-[10px]">ETB</span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className={`text-xs italic ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                        No pricing set
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-sm my-2 font-medium ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                  • Rules: {game.rules}
                </p>

                <div className={`flex items-end justify-between border-t px-2 pt-1 ${isDarkTheme ? 'border-gray-700' : 'border-slate-50'}`}>
                  <div>
                    <span className={`text-xs font-bold uppercase ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                      Single Access
                    </span>
                    <div className={`text-2xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>
                      {game.ticket_types?.find((t) => t.category === "adult")
                        ?.price ?? "—"}
                      <span className="text-xs ml-1">ETB</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/games/${game.id}`}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${isDarkTheme ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
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
            className={`fixed inset-0 backdrop-blur-sm z-40 ${isDarkTheme ? 'bg-black/60' : 'bg-slate-900/40'}`}
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className={`fixed right-0 top-0 h-full w-full max-w-lg z-50 shadow-2xl animate-in slide-in-from-right duration-300 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
            <div className="p-8 h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={handleCreate}
                  className={`w-full ${isDarkTheme ? 'bg-indigo-600' : 'bg-gray-800'} text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all transform active:scale-[0.98]`}
                >
                  Create Attraction
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className={`p-2 rounded-full text-slate-400 ${isDarkTheme ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="space-y-6 overflow-y-auto flex-1 pr-2 pb-4 custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                      Attraction Name
                    </label>
                    <input
                      type="text"
                      className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-white transition-all font-bold ${isDarkTheme ? 'bg-bg3 text-white focus:bg-gray-700' : 'bg-slate-50 focus:bg-white'}`}
                      placeholder="e.g. Roller Coaster"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                        Status
                      </label>
                      <select
                        className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-accent2 transition-all font-bold appearance-none ${isDarkTheme ? 'bg-gray-800 text-white focus:bg-gray-700' : 'bg-slate-50 focus:bg-white'}`}
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as
                              | "OPEN"
                              | "ON_MAINTENANCE"
                              | "UPCOMING"
                              | "CLOSED",
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

                {/* DYNAMIC PRICING MATRIX */}
                <div className="space-y-6">
                  {/* --- 1. DISPLAY ADDED CATEGORIES --- */}
                  {formData.ticket_types.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.ticket_types.map((tt, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200 ${
                            isDarkTheme 
                              ? 'bg-[#1a1a1a] border border-gray-700' 
                              : 'bg-white border border-indigo-100'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                                isDarkTheme
                                  ? 'bg-gray-700 text-gray-200'
                                  : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                {tt.category}
                              </span>
                              <h4 className={`text-sm font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                                {tt.name}
                              </h4>
                            </div>
                            <p className={`text-xs font-medium ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                              {tt.price} ETB
                            </p>
                          </div>
                          <button
                            onClick={() => removeCategory(index)}
                            className={`p-2 rounded-xl transition-all ${
                              isDarkTheme
                                ? 'text-gray-500 hover:bg-red-900/30 hover:text-red-400'
                                : 'text-slate-300 hover:bg-red-50 hover:text-red-500'
                            }`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* --- 2. THE ENTRY FORM --- */}
                  <div className={`p-6 rounded-[32px] border-2 border-dashed space-y-4 ${
                    isDarkTheme
                      ? 'bg-[#1a1a1a] border-gray-700'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${
                        isDarkTheme ? 'bg-indigo-600' : 'bg-gray-800'
                      }`}>
                        <Plus size={16} className="text-white" />
                      </div>
                      <h3 className={`text-sm font-black uppercase tracking-tight ${
                        isDarkTheme ? 'text-white' : 'text-slate-800'
                      }`}>
                        Add New Ticket Category
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={`text-[10px] font-black uppercase ml-1 ${
                          isDarkTheme ? 'text-gray-500' : 'text-slate-400'
                        }`}>
                          Ticket Name
                        </label>
                        <input
                          placeholder="e.g., Adult Ticket"
                          className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition-colors ${
                            isDarkTheme
                              ? 'bg-[#0A0A0A] border-gray-700 text-white focus:border-indigo-500'
                              : 'bg-white border-slate-200 focus:border-indigo-500'
                          }`}
                          value={newTicket.name}
                          onChange={(e) =>
                            setNewTicket({ ...newTicket, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-black uppercase ml-1 ${
                          isDarkTheme ? 'text-gray-500' : 'text-slate-400'
                        }`}>
                          Category
                        </label>
                        <select
                          className={`w-full p-3 rounded-xl border outline-none font-bold text-sm appearance-none ${
                            isDarkTheme
                              ? 'bg-[#0A0A0A] border-gray-700 text-white focus:border-indigo-500'
                              : 'bg-white border-slate-200 focus:border-indigo-500'
                          }`}
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
                                  className={isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'}
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
                        <label className={`text-[10px] font-black uppercase ml-1 ${
                          isDarkTheme ? 'text-gray-500' : 'text-slate-400'
                        }`}>
                          Price (ETB)
                        </label>
                        <input
                          type="number"
                          placeholder="0.0"
                          className={`w-full p-3 rounded-xl border outline-none font-black text-sm ${
                            isDarkTheme
                              ? 'bg-[#0A0A0A] border-gray-700 text-white focus:border-indigo-500'
                              : 'bg-white border-slate-200 focus:border-indigo-500'
                          }`}
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
                        <label className={`text-[10px] font-black uppercase ml-1 ${
                          isDarkTheme ? 'text-gray-500' : 'text-slate-400'
                        }`}>
                          Max Qty
                        </label>
                        <input
                          type="number"
                          className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${
                            isDarkTheme
                              ? 'bg-[#0A0A0A] border-gray-700 text-white focus:border-indigo-500'
                              : 'bg-white border-slate-200 focus:border-indigo-500'
                          }`}
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
                      <label className={`text-[10px] font-black uppercase ml-1 ${
                        isDarkTheme ? 'text-gray-500' : 'text-slate-400'
                      }`}>
                        Description
                      </label>
                      <textarea
                        placeholder="Short description for the customer..."
                        rows={2}
                        className={`w-full p-3 rounded-xl border outline-none text-sm ${
                          isDarkTheme
                            ? 'bg-[#0A0A0A] border-gray-700 text-white focus:border-indigo-500'
                            : 'bg-white border-slate-200 focus:border-indigo-500'
                        }`}
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
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg ${
                        isDarkTheme
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-800 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Add Category to List
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                    Ride Rules
                  </label>
                  <textarea
                    className={`w-full p-4 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium min-h-[100px] ${
                      isDarkTheme ? 'bg-bg3 text-white focus:bg-gray-700' : 'bg-slate-50 focus:bg-white'
                    }`}
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
        </>
      )}
    </div>
  );
};

export default GamesManagementPage;