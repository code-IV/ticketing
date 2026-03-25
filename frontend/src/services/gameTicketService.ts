import { api } from '@/lib/api';

export const gameTicketService = {
  async getGameTicketsDetails(gameId: string) {
    const response = await api.get(`/tickets/game/${gameId}`);
    return response.data;
  }
};
