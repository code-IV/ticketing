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
  Calendar,
  ArrowUp,
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
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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
    category: "ADULT",
    price: 0,
    description: "",
    maxQuantityPerBooking: 10,
  });

  useEffect(() => {
    loadGames();
  }, []);

  // Apply filters whenever games, search, or status filter changes
  useEffect(() => {
    let filtered = games;

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(game => game.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredGames(filtered);
  }, [games, searchQuery, statusFilter]);

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

  const handleStatusChange = async (gameId: string, newStatus: string) => {
    try {
      // Use updateGame instead of updateGameStatus
      await gameService.updateGame(gameId, { status: newStatus as Game['status'] });
      // Update local state
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === gameId ? { ...game, status: newStatus as Game['status'] } : game
        )
      );
    } catch (error) {
      console.error("Failed to update game status:", error);
    }
  };

  const handleDelete = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this game?')) {
      try {
        await gameService.deleteGame(gameId);
        setGames(prevGames => prevGames.filter(game => game.id !== gameId));
      } catch (error) {
        console.error("Failed to delete game:", error);
      }
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
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
          {[
            {
              label: "Active Rides",
              value: games.filter(g => g.status === 'OPEN').length.toString(),
              icon: <Activity />,
              color: "text-green-600",
            },
            {
              label: "Under Repair",
              value: games.filter(g => g.status === 'ON_MAINTENANCE').length.toString(),
              icon: <Settings />,
              color: "text-orange-600",
            },
            {
              label: "Closed",
              value: games.filter(g => g.status === 'CLOSED').length.toString(),
              icon: <AlertTriangle />,
              color: "text-red-600",
            },
            {
              label: "Upcoming",
              value: games.filter(g => g.status === 'UPCOMING').length.toString(),
              icon: <Calendar />,
              color: "text-blue-600",
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
        
        {/* ANALYTICS BUTTON - Far Right of Page */}
        <div className="flex items-end">
          <Link
            href="/admin/analitics/games"
            className={`group flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              isDarkTheme 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 hover:from-indigo-700 hover:to-purple-700' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-400 hover:from-blue-600 hover:to-purple-600'
            } text-white font-bold shadow-lg`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>View Analytics</span>
            <ArrowUp className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </Link>
        </div>
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
        
        {/* Status Filter Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-accent2 outline-none font-medium min-w-40
            ${isDarkTheme ? 'bg-bg3 text-white' : 'bg-slate-50 text-slate-900'}`}
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="ON_MAINTENANCE">Under Maintenance</option>
          <option value="UPCOMING">Upcoming</option>
        </select>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => router.push(`/admin/games/${game.id}`)}
              className={`group relative rounded-3xl border shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer ${
                isDarkTheme ? 'bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-slate-200'
              }`}
            >
              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              
              <div className="relative p-8">
                <div className="flex justify-between items-start mb-6">
                  {/* Status chip with enhanced styling */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${
                      statusConfig(isDarkTheme)[game.status]?.bg
                    } ${statusConfig(isDarkTheme)[game.status]?.text}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                    {statusConfig(isDarkTheme)[game.status]?.label}
                  </div>

                  {/* Hover actions: status dropdown, delete */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    {/* Status Dropdown */}
                    <select
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border outline-none cursor-pointer shadow-sm transition-all ${
                        isDarkTheme 
                          ? 'bg-gray-900 text-white border-gray-600' 
                          : 'bg-gray-800 text-white border-gray-600'
                      }`}
                      value={game.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(game.id, e.target.value);
                      }}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ON_MAINTENANCE">MAINTENANCE</option>
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>

                    {/* Delete Button */}
                    <button
                      className={`p-2 rounded-xl shadow-sm transition-all hover:shadow-md hover:scale-105 ${
                        isDarkTheme 
                          ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' 
                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className={`text-2xl font-black mb-6 bg-gradient-to-r ${
                  isDarkTheme 
                    ? 'from-white to-gray-300' 
                    : 'from-slate-900 to-slate-700'
                } bg-clip-text text-transparent`}>
                  {game.name}
                </h3>
                
                {/* Action Button with enhanced styling */}
                <div className={`flex justify-end border-t pt-6 ${
                  isDarkTheme ? 'border-gray-700/50' : 'border-slate-200/50'
                }`}>
                  <Link
                    href={`/admin/analitics/games/${game.id}`}
                    className={`group/btn relative px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      isDarkTheme 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
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
                                | "ADULT"
                                | "STUDENT"
                                | "CHILD"
                                | "GROUP"
                                | "SENIOR",
                            })
                          }
                        >
                          {["ADULT", "CHILD", "SENIOR", "STUDENT", "GROUP"].map(
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