export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: "SUPERADMIN" | "ADMIN" | "STAFF" | "VISITOR";
  roles?: ("SUPERADMIN" | "ADMIN" | "STAFF" | "VISITOR")[];
  permissions?: ("SUPERADMIN" | "ADMIN" | "STAFF" | "VISITOR")[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  productId?: string;
  name: string;
  description: string;
  rules: string;
  status: "OPEN" | "ON_MAINTENANCE" | "UPCOMING" | "CLOSED";
  mediaIds?: string[];
  ticketTypes?: TicketType[];
  gallery?: MediaItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  label: string;
  thumbnailUrl?: string;
  sort_order?: number; // Keep as sort_order to match backend
  file?: File;
}

export interface MediaDisplayItem {
  type: "image" | "video";
  url: string;
  thumbnail: string;
  alt: string;
}

export interface CreateGame {
  name: string;
  description: string;
  rules: string;
  status: "OPEN" | "ON_MAINTENANCE" | "UPCOMING" | "CLOSED";
  mediaIds: string[];
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  ticketsSold: number;
  availableTickets?: number;
  isActive: boolean;
  status?: "ACTIVE" | "CANCELLED" | "COMPLETED" | "UPCOMING";
  ticketTypes?: TicketType[];
  gallery?: MediaItem[];
}

export interface TicketType {
  id: string;
  productId: string;
  category: "ADULT" | "CHILD" | "SENIOR" | "STUDENT" | "GROUP";
  price: number;
  max_quantity: number;
  status?: "ACTIVE" | "INACTIVE";
  created_at?: string;
  updated_at?: string;
}

export interface CreateTicketTypeRequest {
  category: "ADULT" | "CHILD" | "SENIOR" | "STUDENT" | "GROUP";
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
  ticketType: {
    name: string;
    category: string;
    price: number;
  };
}

export interface Bookings {
  id: string;
  bookingReference: string;
  totalAmount: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  type: "GAME" | "EVENT";
  eventDate?: string;
  bookedAt: string;
  ticket?: {
    status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "FULLY_USED";
    expiresAt: string;
    passDetails: {
      productName: string;
      totalQuantity: number;
      usedQuantity: number;
    }[];
  };
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  totalAmount: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod?: "CREDIT_CARD" | "DEBIT_CARD" | "TELEBIRR" | "CASH";
  bookedAt: string;
  updatedAt: string;
  passes: Passes;
  ticket?: Ticket;
}

// 1. Specific interface for Single-Event bookings
export interface EventBooking {
  type: "EVENT";
  name: string;
  eventId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  ticketTypes: TicketTypes[];
}

// 2. Specific interface for Multi-Game bookings
export interface GameBooking {
  type: "GAME";
  name: string;
  gameId: string;
  ticketTypes: TicketTypes[];
}

export interface TicketTypes {
  category?: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface Passes {
  events?: EventBooking[];
  games?: GameBooking[];
}

export interface Ticket {
  id: string;
  booking_id?: string;
  ticket_code: string;
  qr_token: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "FULLY_USED";
  expires_at: string;
  created_at?: string;
  updated_at?: string;
  passes?: Ticket_Product[];
}

export interface Ticket_Product {
  gameData: any;
  id: string;
  productName: string;
  productType: "EVENT" | "GAME";
  usageDetails: {
    category: "ADULT" | "CHILD" | "SENIOR" | "STUDENT" | "GROUP";
    totalQuantity: number;
    usedQuantity: number;
    status: "AVAILABLE" | "USED";
    lastUsedAt: string;
  }[];
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: string;
  payment_method: "CREDIT_CARD" | "DEBIT_CARD" | "TELEBIRR" | "CASH";
  payment_status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transaction_reference?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  topPerformers: any;
  revenueByTicketType: never[];
  timeSeries: never[];
  summary: any;
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    users?: T[];
    events?: T[];
    bookings?: T[];
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
  totalRevenue: number;
  totalTicketsSold: number;
  activeGames: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
}

export interface TopGame {
  game: string;
  revenue: number;
}

export interface TicketsTrend {
  date: string;
  ticketsSold: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  revenueTrend: RevenueTrend[];
  topGames: TopGame[];
  ticketsTrend: TicketsTrend[];
}

export interface LegacyDashboardStats {
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

// ==================== Types For Booking analytics ====================
export interface BookingAnalytics {
  bookingData: BookingData[];
  gameBookingData: GameBookingData[];
  topGameData: TopGameData[];
  eventBookingData: EventBookingData[];
}

export interface BookingData {
  date: string;
  tickets: number;
  revenue: number;
}

export interface GameBookingData {
  game: string;
  tickets: number;
  revenue: number;
  sessions: number;
}

export interface TopGameData {
  game: string;
  tickets: number;
  revenue: number;
  topTicketType: string;
  topTicketPrice: number;
  topTicketSold: number;
}

export interface EventBookingData {
  event: string;
  booked: number;
  capacity: number;
  occupancy: number;
  revenue: number;
}
