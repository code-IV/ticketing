import { api } from '@/lib/api';

const ticketService = {
  /**
   * Get current user's game tickets
   */
  async getMyTickets(page = 1, limit = 20) {
    try {
      const response = await api.get(`/tickets/my?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId) {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get ticket by code
   */
  async getTicketByCode(ticketCode) {
    try {
      const response = await api.get(`/tickets/code/${ticketCode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all tickets for a specific game
   */
  async getGameTicketsDetails(gameId) {
    try {
      const response = await api.get(`/tickets/game/${gameId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default ticketService;
