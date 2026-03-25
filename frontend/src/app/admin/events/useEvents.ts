import { useState, useEffect, useMemo } from "react";
import { adminService } from "@/services/adminService";
import { Event } from "@/types";

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllEvents(1, 50);
      setEvents(response.data.events || []);
    } catch (err) {
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((event) =>
        statusFilter === "ACTIVE" ? event.isActive : !event.isActive,
      );
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return filtered;
  }, [events, searchQuery, statusFilter]);

  const handleStatusChange = async (eventId: string, newStatus: boolean) => {
    try {
      await adminService.updateEvent(eventId, { isActive: newStatus });
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, isActive: newStatus } : event,
        ),
      );
    } catch (error) {
      console.error("Failed to update event status:", error);
    }
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

  return {
    events,
    filteredEvents,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleStatusChange,
    handleDeleteEvent,
    refresh: loadEvents,
  };
};
