const Event = require("../models/Event");
const TicketType = require("../models/TicketType");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { apiResponse } = require("../utils/helpers");

const adminController = {
  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * GET /api/admin/dashboard - Get dashboard summary
   */
  async getDashboard(req, res, next) {
    try {
      const revenue = await Payment.getRevenueSummary();
      const { events } = await Event.findAll({ page: 1, limit: 5 });
      const { bookings } = await Booking.findAll({ page: 1, limit: 5 });

      return apiResponse(res, 200, true, "Dashboard data retrieved.", {
        revenue,
        recentEvents: events,
        recentBookings: bookings,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // EVENT MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/events - Get all events (including inactive/past)
   */
  async getAllEvents(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await Event.findAll({ page, limit });
      return apiResponse(res, 200, true, "Events retrieved.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/events - Create a new event
   */
  async createEvent(req, res, next) {
    try {
      const { name, description, eventDate, startTime, endTime, capacity } =
        req.body;

      const event = await Event.create({
        name,
        description,
        eventDate,
        startTime,
        endTime,
        capacity,
        createdBy: req.session.user.id,
      });

      return apiResponse(res, 201, true, "Event created successfully.", {
        event,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/events/:id - Update an event
   */
  async updateEvent(req, res, next) {
    try {
      const {
        name,
        description,
        eventDate,
        startTime,
        endTime,
        capacity,
        isActive,
      } = req.body;

      const existing = await Event.findById(req.params.id);
      if (!existing) {
        return apiResponse(res, 404, false, "Event not found.");
      }

      const event = await Event.update(req.params.id, {
        name,
        description,
        eventDate,
        startTime,
        endTime,
        capacity,
        isActive,
      });

      return apiResponse(res, 200, true, "Event updated successfully.", {
        event,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/events/:id - Deactivate an event
   */
  async deleteEvent(req, res, next) {
    try {
      const event = await Event.deactivate(req.params.id);
      if (!event) {
        return apiResponse(res, 404, false, "Event not found.");
      }
      return apiResponse(res, 200, true, "Event deactivated successfully.", {
        event,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // TICKET TYPE MANAGEMENT
  // ============================================

  /**
   * POST /api/admin/ticket-types - Create a ticket type
   */
  async createTicketType(req, res, next) {
    try {
      const {
        eventId,
        name,
        category,
        price,
        description,
        maxQuantityPerBooking,
      } = req.body;

      // Verify event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return apiResponse(res, 404, false, "Event not found.");
      }

      const ticketType = await TicketType.create({
        eventId,
        name,
        category,
        price,
        description,
        maxQuantityPerBooking,
      });

      return apiResponse(res, 201, true, "Ticket type created successfully.", {
        ticketType,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/ticket-types/:id - Update a ticket type
   */
  async updateTicketType(req, res, next) {
    try {
      const {
        name,
        category,
        price,
        description,
        maxQuantityPerBooking,
        isActive,
      } = req.body;

      const existing = await TicketType.findById(req.params.id);
      if (!existing) {
        return apiResponse(res, 404, false, "Ticket type not found.");
      }

      const ticketType = await TicketType.update(req.params.id, {
        name,
        category,
        price,
        description,
        maxQuantityPerBooking,
        isActive,
      });

      return apiResponse(res, 200, true, "Ticket type updated successfully.", {
        ticketType,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/ticket-types/:id - Deactivate a ticket type
   */
  async deleteTicketType(req, res, next) {
    try {
      const ticketType = await TicketType.deactivate(req.params.id);
      if (!ticketType) {
        return apiResponse(res, 404, false, "Ticket type not found.");
      }
      return apiResponse(
        res,
        200,
        true,
        "Ticket type deactivated successfully.",
        { ticketType },
      );
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // BOOKING MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/bookings - Get all bookings
   */
  async getAllBookings(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const status = req.query.status || null;

      const result = await Booking.findAll({ page, limit, status });
      return apiResponse(res, 200, true, "Bookings retrieved.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/bookings/:id - Get booking details (admin)
   */
  async getBookingDetails(req, res, next) {
    try {
      const booking = await Booking.findByIdWithDetails(req.params.id);
      if (!booking) {
        return apiResponse(res, 404, false, "Booking not found.");
      }
      return apiResponse(res, 200, true, "Booking retrieved.", { booking });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/bookings/:id/cancel - Cancel a booking (admin)
   */
  async cancelBooking(req, res, next) {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return apiResponse(res, 404, false, "Booking not found.");
      }
      if (booking.booking_status === "cancelled") {
        return apiResponse(res, 400, false, "Booking is already cancelled.");
      }

      const result = await Booking.cancel(req.params.id);
      return apiResponse(
        res,
        200,
        true,
        "Booking cancelled successfully.",
        result,
      );
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/users - Get all users
   */
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const role = req.query.role || null;

      const result = await User.findAll({ page, limit, role });
      return apiResponse(res, 200, true, "Users retrieved.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/users/:id - Get user details
   */
  async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return apiResponse(res, 404, false, "User not found.");
      }
      return apiResponse(res, 200, true, "User retrieved.", { user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/users/:id - Update user information
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;

      // 1. Properly await the check and check for null
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return apiResponse(res, 404, false, "User not found");
      }
      const { first_name, last_name, email, phone, role, is_active } = req.body;

      // 3. Map the body fields to the model's expected arguments
      const updatedUser = await User.updateUser(id, {
        firstName: first_name,
        lastName: last_name,
        email: email,
        phone: phone,
        role: role,
        isActive: is_active,
      });
      return apiResponse(res, 200, true, "User type updated successfully.", {
        user: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/users/:id/toggle-active - Toggle user active status
   */
  async toggleUserActive(req, res, next) {
    try {
      // Prevent admin from deactivating themselves
      if (req.params.id === req.session.user.id) {
        return apiResponse(
          res,
          400,
          false,
          "You cannot deactivate your own account.",
        );
      }

      const user = await User.toggleActive(req.params.id);
      if (!user) {
        return apiResponse(res, 404, false, "User not found.");
      }

      const status = user.is_active ? "activated" : "deactivated";
      return apiResponse(res, 200, true, `User ${status} successfully.`, {
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // REPORTS
  // ============================================

  /**
   * GET /api/admin/reports/revenue - Revenue summary
   */
  async getRevenueSummary(req, res, next) {
    try {
      const summary = await Payment.getRevenueSummary();
      return apiResponse(res, 200, true, "Revenue summary retrieved.", {
        summary,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/reports/daily-revenue - Daily revenue report
   */
  async getDailyRevenue(req, res, next) {
    try {
      const startDate =
        req.query.startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const endDate =
        req.query.endDate || new Date().toISOString().split("T")[0];

      const data = await Payment.getDailyRevenue(startDate, endDate);
      return apiResponse(res, 200, true, "Daily revenue retrieved.", {
        data,
        startDate,
        endDate,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/reports/payments - Get all payments
   */
  async getAllPayments(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const status = req.query.status || null;

      const result = await Payment.findAll({ page, limit, status });
      return apiResponse(res, 200, true, "Payments retrieved.", result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
