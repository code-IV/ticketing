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
    event: {
      name: string;
      description?: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      capacity: number;
    };
    sessionId: string | null;
  }): Promise<ApiResponse<{ event: Event; productId: string }>> {
    const response = await api.post("/admin/events", data);
    return response.data;
  },

  uploadProductMedia: async (
    formData: FormData, // Accepts the pre-constructed FormData
  ): Promise<any> => {
    const response = await api.post(`/media/upload`, formData, {
      headers: {
        // Note: Most modern browsers/Axios versions set this automatically
        // when they see FormData, including the necessary 'boundary' string.
        "Content-Type": "multipart/form-data",
      },
    });
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
    data: {
      event: Partial<{
        name: string;
        description: string;
        eventDate: string;
        startTime: string;
        endTime: string;
        capacity: number;
        isActive: boolean;
      }>;
      sessionId: string | null;
    },
  ): Promise<ApiResponse<{ event: Event }>> {
    const response = await api.patch(`/admin/event/${id}`, data);
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

  async getRegistrationTrend(): Promise<any> {
    const response = await api.get("/metrics/users/registration-trend");
    return response.data;
  },

  async getRoleBreakdown(): Promise<any> {
    const response = await api.get("/metrics/users/role-breakdown");
    return response.data;
  },

  async getAllUsers(
    page = 1,
    limit = 20,
    role?: string,
    status?: string,
  ): Promise<PaginatedResponse<User>> {
    const params: any = { page, limit };
    if (role) params.role = role;
    if (status) params.status = status;

    const response = await api.get("/admin/users", {
      params,
    });
    return response.data;
  },

  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async updateUser(
    id: string,
    data: {
      role?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      is_active?: boolean;
    },
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

  async createSessions(files: any[]): Promise<ApiResponse> {
    const response = await api.post(`/media/sessions`, { files });
    return response.data;
  },

  async persistMediaData(id: string, uploads: any[]): Promise<ApiResponse> {
    const response = await api.post(`/media/persist/${id}`, { uploads });
    return response.data;
  },

  async getAllMedia(
    page = 1,
    limit = 32,
    type?: "image" | "video" | "all",
  ): Promise<
    ApiResponse<{
      media: never[];
      data: any[];
      pagination: {
        totalPages: number;
        total: number;
        page: number;
        limit: number;
        hasNext: boolean;
      };
    }>
  > {
    const params: any = { page, limit };
    if (type && type !== "all") {
      params.type = type;
    }
    const response = await api.get("/media", { params });
    return response.data;
  },

  async deleteMedia(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/media/rm/${id}`);
    return response.data;
  },

  async getMediaUrl(id: string): Promise<ApiResponse> {
    const response = await api.get(`/media/url/${id}`);
    return response.data;
  },

  async updateMediaData(id: string, formData: FormData): Promise<ApiResponse> {
    const response = await api.patch(`/media/upload/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export const ticketService = {
  async scanTicket(token: string): Promise<ApiResponse> {
    const response = await api.get("/tickets/scan", {
      params: {
        token,
      },
    });
    return response.data;
  },

  async punchTicket(
    usage: { passId: string; quantity: number }[],
  ): Promise<ApiResponse> {
    const response = await api.post("/tickets/punch", usage);
    return response.data;
  },
};

export const gameService = {
  async createGame(data: {
    game: CreateGame;
    sessionId: string | null;
  }): Promise<
    ApiResponse<{
      game: Game;
      productId: string;
      preSignedUrls: string[];
    }>
  > {
    const response = await api.post("/admin/game", data);
    return response.data;
  },
  async updateGame(
    id: string,
    data: {
      game: Partial<Game>;
      sessionId: string | null;
    },
  ): Promise<ApiResponse<Partial<Game>>> {
    const response = await api.patch(`/admin/game/${id}`, data);
    return response.data;
  },
  async getAll(): Promise<ApiResponse<{ games: Game[] }>> {
    const response = await api.get("/games");
    return response.data;
  },
  async getActiveGames(): Promise<ApiResponse<{ games: Game[] }>> {
    const response = await api.get("/games/buy");
    return response.data;
  },
  async getGame(id: string): Promise<ApiResponse<{ game: Partial<Game> }>> {
    const response = await api.get(`/games/${id}`);
    return response.data;
  },
  async deleteGame(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/admin/game/${id}`);
    return response.data;
  },
};
