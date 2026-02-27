import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

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
