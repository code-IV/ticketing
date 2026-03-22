import { api } from "@/lib/api";
import { Game, TicketType, PaginatedResponse, ApiResponse } from "@/types";

export const gameService = {
  async checkAvailability(
    gameId: string,
    quantity: number,
  ): Promise<ApiResponse<{ available: boolean; remaining: number }>> {
    const response = await api.get(`/buy/games/${gameId}/availability`, {
      params: { quantity },
    });
    return response.data;
  },

  async purchaseGameTickets(
    gameId: string,
    ticketTypeId: string,
    quantity: number,
  ): Promise<ApiResponse<any>> {
    const response = await api.post("/buy/purchase", {
      game_id: gameId,
      ticket_type_id: ticketTypeId,
      quantity,
    });
    return response.data;
  },

  async getDashboard(
    startDate: string,
    endDate: string,
    period: string = "d",
  ): Promise<ApiResponse<any>> {
    const response = await api.get(`/admin/games/stats`, {
      params: {
        period,
        startDate,
        endDate,
      },
    });
    return response.data;
  },

  async getAnalytics(
    id: string,
    startDate: string,
    endDate: string,
    period: string = "d",
  ): Promise<ApiResponse<any>> {
    const response = await api.get(`/admin/games/stats/${id}`, {
      params: {
        period,
        startDate,
        endDate,
      },
    });
    return response.data;
  },
};
