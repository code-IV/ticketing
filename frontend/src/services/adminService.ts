import { api } from "@/lib/api";
import {
  Event,
  TicketType,
  Booking,
  User,
  Game,
  CreateGame,
  Payment,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
  CreateEventWithTicketTypesRequest,
} from "@/types";

export const adminService = {
  async getDashboard(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get("/admin/dashboard");
    return response.data;
  },

  async getAllEvents(page = 1, limit = 20): Promise<PaginatedResponse<Event>> {
    const response = await api.get("/admin/events", {
      params: { page, limit },
    });
    return response.data;
  },

  async createEvent(data: {
    name: string;
    description?: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    capacity: number;
  }): Promise<ApiResponse<{ event: Event }>> {
    const response = await api.post("/admin/events", data);
    return response.data;
  },

  async createEventWithTicketTypes(
    data: CreateEventWithTicketTypesRequest,
  ): Promise<ApiResponse<{ event: Event; ticketTypes: TicketType[] }>> {
    const response = await api.post("/admin/events-with-tickets", data);
    return response.data;
  },

  async getEventWithTicketTypes(
    id: string,
  ): Promise<ApiResponse<{ event: Event; ticketTypes: TicketType[] }>> {
    const response = await api.get(`/admin/events/${id}`);
    return response.data;
  },

  async updateEventWithTicketTypes(
    id: string,
    data: CreateEventWithTicketTypesRequest & { isActive: boolean },
  ): Promise<ApiResponse<{ event: Event; ticketTypes: TicketType[] }>> {
    const response = await api.put(`/admin/events/${id}/ticket-types`, data);
    return response.data;
  },

  async updateEvent(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      capacity: number;
      isActive: boolean;
    }>,
  ): Promise<ApiResponse<{ event: Event }>> {
    const response = await api.put(`/admin/events/${id}`, data);
    return response.data;
  },

  // Analytics API calls
  async getRevenueAnalytics(
    startDate?: string,
    endDate?: string,
    groupBy?: string,
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/analytics/revenue", {
      params: { startDate, endDate, groupBy },
    });
    return response.data;
  },

  async getBookingAnalytics(
    startDate?: string,
    endDate?: string,
    groupBy?: string,
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/analytics/bookings", {
      params: { startDate, endDate, groupBy },
    });
    return response.data;
  },

  async getUserAnalytics(
    startDate?: string,
    endDate?: string,
    groupBy?: string,
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/analytics/users", {
      params: { startDate, endDate, groupBy },
    });
    return response.data;
  },

  async getEventAnalytics(
    startDate?: string,
    endDate?: string,
    limit?: number,
  ): Promise<ApiResponse<any>> {
    const response = await api.get("/analytics/events", {
      params: { startDate, endDate, limit },
    });
    return response.data;
  },

  async getDashboardAnalytics(days?: number): Promise<ApiResponse<any>> {
    const response = await api.get("/analytics/dashboard", {
      params: { days },
    });
    return response.data;
  },

  async deleteEvent(id: string): Promise<ApiResponse<{ event: Event }>> {
    const response = await api.delete(`/admin/events/${id}`);
    return response.data;
  },

  async createTicketType(data: {
    eventId: string;
    name: string;
    category: "adult" | "child" | "senior" | "student" | "group";
    price: number;
    description?: string;
    maxQuantityPerBooking?: number;
  }): Promise<ApiResponse<{ ticketType: TicketType }>> {
    const response = await api.post("/admin/ticket-types", data);
    return response.data;
  },

  async updateTicketType(
    id: string,
    data: Partial<{
      name: string;
      category: "adult" | "child" | "senior" | "student" | "group";
      price: number;
      description: string;
      maxQuantityPerBooking: number;
      isActive: boolean;
    }>,
  ): Promise<ApiResponse<{ ticketType: TicketType }>> {
    const response = await api.put(`/admin/ticket-types/${id}`, data);
    return response.data;
  },

  async deleteTicketType(
    id: string,
  ): Promise<ApiResponse<{ ticketType: TicketType }>> {
    const response = await api.delete(`/admin/ticket-types/${id}`);
    return response.data;
  },

  async getAllBookings(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<PaginatedResponse<Booking>> {
    const response = await api.get("/admin/bookings", {
      params: { page, limit, status },
    });
    return response.data;
  },

  async getBookingDetails(
    id: string,
  ): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data;
  },

  async cancelBooking(
    id: string,
  ): Promise<ApiResponse<{ success: boolean; bookingId: string }>> {
    const response = await api.post(`/admin/bookings/${id}/cancel`);
    return response.data;
  },

  async getUserCount(period = "all_time"): Promise<any> {
    const response = await api.get("/metrics/users", {
      params: { period },
    });
    return response.data;
  },

  async getAllUsers(
    page = 1,
    limit = 20,
    role?: string,
  ): Promise<PaginatedResponse<User>> {
    const response = await api.get("/admin/users", {
      params: { page, limit, role },
    });
    return response.data;
  },

  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async updateUser(
    id: string,
    data: Partial<User>,
  ): Promise<ApiResponse<{ user: User }>> {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  async toggleUserActive(id: string): Promise<ApiResponse<{ user: User }>> {
    const response = await api.patch(`/admin/users/${id}/toggle-active`);
    return response.data;
  },

  async getRevenueSummary(): Promise<ApiResponse<{ summary: any }>> {
    const response = await api.get("/admin/reports/revenue");
    return response.data;
  },

  async getDailyRevenue(
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<{ data: any[]; startDate: string; endDate: string }>> {
    const response = await api.get("/admin/reports/daily-revenue", {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getAllPayments(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<PaginatedResponse<Payment>> {
    const response = await api.get("/admin/reports/payments", {
      params: { page, limit, status },
    });
    return response.data;
  },
};

export const gameService = {
  async getAll(): Promise<ApiResponse<Game[]>> {
    const response = await api.get("/admin/games");
    return response.data;
  },
  async createGame(data: CreateGame): Promise<ApiResponse<{ game: Game }>> {
    const response = await api.post("/admin/games", data);
    return response.data;
  },
};
