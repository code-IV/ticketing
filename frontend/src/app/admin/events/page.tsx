"use client";
import React, { useState } from "react";
import {
  Plus,
  Search,
  Activity,
  AlertTriangle,
  BarChart3,
  ArrowUp,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useEvents } from "./useEvents";
import CreateEventDrawer from "./CreateEventDrawer";

const EventsManagementPage = () => {
  const router = useRouter();
  const { isDarkTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    filteredEvents,
    events,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleStatusChange,
    refresh,
  } = useEvents();

  const statusConfig = (isDark: boolean) => ({
    active: {
      bg: isDark ? "bg-green-900/50" : "bg-green-50",
      text: isDark ? "text-green-400" : "text-green-700",
      border: "border-accent",
      label: "ACTIVE",
    },
    inactive: {
      bg: isDark ? "bg-red-900/50" : "bg-red-50",
      text: isDark ? "text-red-400" : "text-red-700",
      border: "border-red-400",
      label: "INACTIVE",
    },
  });

  return (
    <div
      className={`min-h-screen p-8 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#F8FAFC]"}`}
    >
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
          className={`flex items-center justify-center gap-2 bg-accent2 hover:bg-accent2/90 text-black px-6 py-3 rounded-2xl font-bold transition-all active:scale-95`}
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
              value: events.filter((e) => e.isActive).length.toString(),
              icon: <Activity />,
              color: "text-green-600",
            },
            {
              label: "Inactive Events",
              value: events.filter((e) => !e.isActive).length.toString(),
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
        <div className="flex items-end">
          <Link
            href="/admin/analitics/events"
            className={`group flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all bg-accent2 hover:bg-accent2/90 text-black font-bold shadow-lg`}
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
            placeholder="Search events..."
            className={`w-full pl-12 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50 text-slate-900"}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium min-w-40 ${isDarkTheme ? "bg-bg3 text-white" : "bg-slate-50"}`}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* EVENTS GRID */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin h-10 w-10 border-b-2 border-indigo-600 rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEvents.map((event) => {
            const config =
              statusConfig(isDarkTheme)[event.isActive ? "active" : "inactive"];
            return (
              <div
                key={event.id}
                onClick={() => router.push(`/admin/events/${event.id}`)}
                className={`group relative rounded-3xl border shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:border-accent/50 transition-all duration-500 overflow-hidden cursor-pointer ${isDarkTheme ? "bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] border-gray-700" : "bg-linear-to-br from-white to-gray-50 border-slate-200"}`}
              >
                <div className="relative p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase ${config.bg} ${config.text}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                      {config.label}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <select
                        value={event.isActive ? "ACTIVE" : "INACTIVE"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newStatus = e.target.value === "ACTIVE";
                          console.log('Changing status for event', event.id, 'to', newStatus);
                          handleStatusChange(event.id, newStatus);
                        }}
                        className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-gray-800 text-white border border-accent"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                  <h3
                    className={`text-2xl font-black mb-6 ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    {event.name}
                  </h3>
                  <div
                    className={`flex justify-end border-t pt-6 ${isDarkTheme ? "border-gray-700/50" : "border-slate-200/50"}`}
                  >
                    <Link
                      href={`/admin/analitics/events/${event.id}`}
                      className="px-6 py-3 rounded-2xl font-bold text-sm bg-accent2 hover:bg-accent2/90 text-black"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Statistics
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateEventDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
};

export default EventsManagementPage;
