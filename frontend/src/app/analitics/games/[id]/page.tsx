"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { gameService } from "@/services/gameService";

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

// ==================== Types ====================
type Game = {
  id: string;
  name: string;
  status: string;
  totalRevenue: number;
  totalBookings: number;
};

// ==================== Main Component ====================
export default function GameDetailPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const gameId = id;

  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      const fetchGameData = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await gameService.getAnalytics(
            gameId,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            new Date().toISOString(), // now
            '7d'
          );
          setGameData(response.data);
          console.log('Game analytics data:', response.data);
        } catch (error) {
          console.error('Error fetching game analytics:', error);
          setError('Failed to load game data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchGameData();
    }
  }, [gameId]);

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}>
        <p className={isDarkTheme ? "text-white" : "text-gray-900"}>Loading game analytics...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}>
        <div className="text-center">
          <p className={`text-red-600 mb-4`}>{error}</p>
          <button
            onClick={() => router.push("/analitics/games")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  // Show game not found state
  if (!gameData) {
    return (
      <div
        className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1
              className={`text-2xl font-bold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
            >
              Game Not Found
            </h1>
            <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              The game you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/analitics/games")}
              className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-700"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Remove all mock data usage
  // const gameEvents = mockEvents.filter((e) => e.game === selectedGame.name);
  // const gameRevenueSeries = getGameRevenueSeries(selectedGame.id, dateRange);
  // const gameBookingsSeries = getGameBookingsSeries(selectedGame.id, dateRange);
  // const ticketTypeData = getTicketTypeData(selectedGame.id);
  // const ticketPerformanceData = getTicketPerformanceData(selectedGame.id);
  // const revenueContributionSeries = getRevenueContributionSeries(selectedGame.id);
  // const revenuePerTicketSeries = getRevenuePerTicketSeries(selectedGame.id);

  return (
    <div
      className={`min-h-screen p-6 ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1
              className={`text-3xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
            >
              Game Analytics
            </h1>
          </div>
          <button
            onClick={() => router.push("/analitics/games")}
            className={`flex items-center gap-2 text-sm ${isDarkTheme ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            <ChevronLeft size={16} /> Back to Games
          </button>
          <h2
            className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Game ID: {gameId}
          </h2>
          
          {/* Basic info from API data */}
          <div className={`rounded-xl p-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              API Response Data
            </h3>
            <pre className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              {JSON.stringify(gameData, null, 2)}
            </pre>
          </div>
          
          {/* Placeholder for future charts */}
          <div className={`rounded-xl p-6 ${isDarkTheme ? "bg-[#0A0A0A] border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              Charts will be implemented here once API data structure is finalized
            </h3>
            <p className={`${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
              Revenue trends, booking analytics, and ticket performance charts will be added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
