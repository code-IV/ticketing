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
  category?: string;
  capacity?: number;
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

export interface GameBundle {
  gameId: string;
  ticketTypeId: string;
  category: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface GameTicket {
  id: string;
  game_id: string;
  game_name: string;
  game_description: string;
  game_rules: string;
  total_price: number;
  status: string;
  ticket_game_status: string;
  purchased_at: string;
  expires_at: string;
  payment_reference?: string;
  quantity: number;
  type: "GAME_CONSOLIDATED";
  ticket_type_name?: string;
  ticket_type_category?: string;
  ticket_price: number;
  ticket_codes: string[];
  game_used_at?: string;
}

export interface GameTicketDetail {
  id: string;
  ticket_code: string;
  qr_token: string;
  status: string;
  ticket_game_status: string;
  purchased_at: string;
  expires_at: string;
  total_price: number;
  used_at?: string;
  game: {
    id: string;
    name: string;
    description: string;
    rules: string;
  };
  ticket_type: {
    name: string;
    category: string;
    price: number;
  };
}

export interface Booking {
  id: string;
  booking_reference: string;
  user_id: string;
  event_id?: string;
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

export type BookingType = "EVENT" | "GAME";

export interface BaseBooking {
  id: string;
  booking_reference: string;
  user_id: string;
  total_amount: string;
  booking_status: "pending" | "confirmed" | "cancelled" | "refunded";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  payment_method?: "credit_card" | "debit_card" | "telebirr" | "cash";
  guest_email?: string;
  guest_name?: string;
  notes?: string;
  booked_at: string;
  created_at: string;
  updated_at: string;
  // Shared relations
  tickets?: Ticket[];
}

// 1. Specific interface for Single-Event bookings
export interface EventBooking extends BaseBooking {
  type: "EVENT";
  event_id: string;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
}

// 2. Specific interface for Multi-Game bookings
export interface GameBooking extends BaseBooking {
  type: "GAME";
  // For games, the details live inside the items array
  items: GameBookingItemDetail[];
}

// 3. The Union Type used in your components
export type Bookings = EventBooking | GameBooking;

// Supporting interface for game items
export interface GameBookingItemDetail {
  id: string;
  booking_id: string;
  ticket_type_id: string;
  game_id: string;
  game_name: string; // From our SQL Join
  category?: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Ticket {
  id: string;
  booking_id: string;
  booking_item_id: string;
  ticket_code: string;
  qr_data: string;
  qr_token: string;
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
    games?: T[];
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
