import { api } from "@/lib/api";
import {
  Event,
  TicketType,
  PaginatedResponse,
  ApiResponse,
  CreateTicketTypeRequest,
} from "@/types";

export const eventService = {
  async getActiveEvents(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Event>> {
    const response = await api.get("/events", { params: { page, limit } });
    return response.data;
  },

  async getEventById(id: string): Promise<ApiResponse<Event>> {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  async checkAvailability(
    id: string,
    quantity: number,
  ): Promise<ApiResponse<{ available: boolean; remaining: number }>> {
    const response = await api.get(`/events/${id}/availability`, {
      params: { quantity },
    });
    return response.data;
  },

  async getTicketTypes(
    id: string,
  ): Promise<ApiResponse<{ ticketTypes: TicketType[] }>> {
    const response = await api.get(`/events/${id}/ticket-types`);
    return response.data;
  },

  async getDashboard(
    startDate: string,
    endDate: string,
    period: string = "d",
  ): Promise<ApiResponse<any>> {
    const response = await api.get(`/events/stats`, {
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
    const response = await api.get(`/events/stats/${id}`, {
      params: {
        period,
        startDate,
        endDate,
      },
    });
    return response.data;
  },
};
