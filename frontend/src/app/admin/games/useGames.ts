"use client";
import { useState, useEffect, useMemo } from "react";
import { gameService } from "@/services/adminService";
import { Game } from "@/types";

export const useGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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

  useEffect(() => { loadGames(); }, []);

  const filteredGamesMemo = useMemo(() => {
    let filtered = games;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(game => game.status === statusFilter);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [games, searchQuery, statusFilter]);

  const handleStatusChange = async (gameId: string, newStatus: string) => {
    try {
      await gameService.updateGame(gameId, { status: newStatus as any });
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, status: newStatus as any } : g));
    } catch (error) {
      console.error("Failed to update game status:", error);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    try {
      await gameService.deleteGame(gameId);
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
    } catch (error) {
      console.error("Failed to delete game:", error);
    }
  };

  return {
    games, filteredGames: filteredGamesMemo, loading, error,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    handleStatusChange, handleDelete, refresh: loadGames
  };
};