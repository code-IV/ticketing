export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "admin" | "visitor";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  rules: string;
  status: "OPEN" | "ON_MAINTENANCE" | "UPCOMING" | "CLOSED";
  ticket_types?: TicketType[];
  created_at: string;
  updated_at: string;
}

export interface CreateGame {
  name: string;
  description: string;
  rules: string;
  status: "OPEN" | "ON_MAINTENANCE" | "UPCOMING" | "CLOSED";
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  tickets_sold: number;
  available_tickets?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  ticket_types?: TicketType[];
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  category: "adult" | "child" | "senior" | "student" | "group";
  price: number;
  description?: string;
  max_quantity_per_booking: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketTypeRequest {
  name: string;
  category: "adult" | "child" | "senior" | "student" | "group";
  price: number;
  description?: string;
  maxQuantityPerBooking?: number;
}

export interface CreateEventWithTicketTypesRequest {
  name: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  ticketTypes: CreateTicketTypeRequest[];
}

export interface BookingItem {
  ticketTypeId: string;
  quantity: number;
  unitPrice?: number;
}

export interface Booking {
  id: string;
  booking_reference: string;
  user_id: string;
  event_id: string;
  event_name?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  total_amount: string;
  booking_status: "pending" | "confirmed" | "cancelled" | "refunded";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  payment_method?: "credit_card" | "debit_card" | "telebirr" | "cash";
  guest_email?: string;
  guest_name?: string;
  notes?: string;
  booked_at: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  items?: BookingItemDetail[];
  tickets?: Ticket[];
}

export interface BookingItemDetail {
  id: string;
  booking_id: string;
  ticket_type_id: string;
  ticket_type_name?: string;
  category?: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  booking_id: string;
  booking_item_id: string;
  ticket_code: string;
  qr_data: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  ticket_type_name?: string;
  category?: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: string;
  payment_method: "credit_card" | "debit_card" | "telebirr" | "cash";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  transaction_reference?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    events?: T[];
    bookings?: T[];
    users?: T[];
    payments?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CartItem {
  ticketType: TicketType;
  quantity: number;
  event: Event;
}

export interface DashboardStats {
  revenue: {
    total_transactions: number;
    total_revenue: string;
    total_refunded: string;
    today_revenue: string;
    today_transactions: number;
  };
  recentEvents: Event[];
  recentBookings: Booking[];
}
