import { api } from '@/lib/api';
import { Game, TicketType, PaginatedResponse, ApiResponse } from '@/types';

export const gameService = {
  async getActiveGames(page = 1, limit = 20): Promise<PaginatedResponse<Game>> {
    const response = await api.get('/buy/games', { params: { page, limit } });
    return {
      success: response.data.success,
      message: response.data.message,
      data: {
        games: response.data.data || response.data.games || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: response.data.data?.length || 0,
          totalPages: 1
        }
      }
    };
  },

  async getGameById(id: string): Promise<ApiResponse<{ game: Game; ticketTypes: TicketType[] }>> {
    const response = await api.get(`/buy/games/${id}`);
    return response.data;
  },

  async checkAvailability(
    gameId: string,
    quantity: number
  ): Promise<ApiResponse<{ available: boolean; remaining: number }>> {
    const response = await api.get(`/buy/games/${gameId}/availability`, { params: { quantity } });
    return response.data;
  },

  async purchaseGameTickets(gameId: string, ticketTypeId: string, quantity: number): Promise<ApiResponse<any>> {
    const response = await api.post('/buy/purchase', {
      game_id: gameId,
      ticket_type_id: ticketTypeId,
      quantity,
    });
    return response.data;
  },
};
