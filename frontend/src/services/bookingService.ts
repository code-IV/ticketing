import { api } from "@/lib/api";
import {
  Booking,
  BookingItem,
  GameBundle,
  Ticket,
  PaginatedResponse,
  ApiResponse,
  Bookings,
} from "@/types";

export const bookingService = {
  async createBooking(data: {
    eventId: string;
    items: BookingItem[];
    paymentMethod: "credit_card" | "debit_card" | "telebirr" | "cash";
    guestEmail?: string;
    guestName?: string;
    notes?: string;
    expires_at?: string;
  }): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.post("/bookings/event", data);
    return response.data;
  },
  async createBookingGames(data: {
    items: GameBundle[];
    totalAmount: number;
    paymentMethod: "credit_card" | "debit_card" | "telebirr" | "cash";
    guestEmail?: string;
    guestName?: string;
    notes?: string;
  }): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.post("/bookings/games", data);
    return response.data;
  },
  async getMyBookings(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Bookings>> {
    const response = await api.get("/bookings/my", { params: { page, limit } });
    return response.data;
  },

  async getBookingById(id: string): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  async getBookingByReference(
    reference: string,
  ): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.get(`/bookings/reference/${reference}`);
    return response.data;
  },

  async cancelBooking(
    id: string,
  ): Promise<ApiResponse<{ success: boolean; bookingId: string }>> {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },

  async getBookingTickets(
    id: string,
  ): Promise<ApiResponse<{ tickets: Ticket[] }>> {
    const response = await api.get(`/bookings/${id}/tickets`);
    return response.data;
  },
};
