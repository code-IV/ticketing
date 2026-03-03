const { Booking } = require("../models/Booking");
const Event = require("../models/Event");
const TicketType = require("../models/TicketType");
const Ticket = require("../models/Ticket");
const { apiResponse } = require("../../utils/helpers");
const bookingStatsService = require("../services/bookingStatsService");

const bookingController = {
  /**
   * POST /api/bookings/event - Create a new booking
   */
  async createBookingEvent(req, res, next) {
    try {
      const {
        eventId,
        items,
        paymentMethod,
        guestEmail,
        guestName,
        notes,
        expires_at,
      } = req.body;
      const userId = req.session.user.id;

      // Verify event exists and is active
      const event = await Event.findById(eventId);
      if (!event || !event.is_active) {
        return apiResponse(res, 404, false, "Event not found or is inactive.");
      }

      // Check if event date is in the future
      if (new Date(event.event_date) < new Date().setHours(0, 0, 0, 0)) {
        return apiResponse(
          res,
          400,
          false,
          "Cannot book tickets for past events.",
        );
      }

      // Validate each item and resolve prices from DB
      const resolvedItems = [];
      let totalQuantity = 0;

      for (const item of items) {
        const ticketType = await TicketType.findById(item.ticketTypeId);
        if (!ticketType) {
          return apiResponse(
            res,
            400,
            false,
            `Ticket type ${item.ticketTypeId} not found or inactive.`,
          );
        }
        if (item.quantity > ticketType.max_quantity_per_booking) {
          return apiResponse(
            res,
            400,
            false,
            `Maximum ${ticketType.max_quantity_per_booking} tickets allowed per booking for ${ticketType.name}.`,
          );
        }

        totalQuantity += item.quantity;
        resolvedItems.push({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: parseFloat(ticketType.price),
        });
      }

      // Check overall availability
      const availability = await Event.checkAvailability(
        eventId,
        totalQuantity,
      );
      if (!availability.available) {
        return apiResponse(
          res,
          400,
          false,
          `Not enough tickets available. Only ${availability.remaining} remaining.`,
        );
      }
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);

      // Create the booking (transactional)
      const booking = await Booking.bookEvent({
        userId,
        eventId,
        items: resolvedItems,
        paymentMethod,
        guestEmail,
        guestName,
        notes,
        expires_at: expires,
      });

      return apiResponse(res, 201, true, "Booking created successfully.", {
        booking,
      });
    } catch (err) {
      next(err);
    }
  },

  async createBookingGames(req, res, next) {
    try {
      const {
        items, // [{ ticketTypeId, quantity }]
        totalAmount,
        paymentMethod,
        guestEmail,
        guestName,
        notes,
      } = req.body;
      const userId = req.session.user.id;
      const expiresAt = new Date(); //leave it like this for now

      // 4️⃣ Call transactional booking service
      const booking = await Booking.bookGames({
        userId,
        items,
        totalAmount,
        paymentMethod,
        guestEmail,
        guestName,
        notes,
        expires_at: expiresAt,
      });

      return apiResponse(
        res,
        201,
        true,
        "Game bundle booking created successfully.",
        { booking },
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/bookings/my - Get current user's bookings
   */
  async getMyBookings(req, res, next) {
    try {
      // Disable caching for bookings endpoints
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.removeHeader("ETag"); // Clear ETag to prevent 304 responses

      const userId = req.session.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

      const result = await Booking.findByUserId(userId, { page, limit });
      return apiResponse(res, 200, true, "Bookings retrieved.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/bookings/:id - Get booking details
   */
  async getBookingById(req, res, next) {
    try {
      const booking = await Booking.findByIdWithDetails(req.params.id);
      if (!booking) {
        return apiResponse(res, 404, false, "Booking not found.");
      }

      // Ensure user can only see their own bookings (unless admin)
      if (
        req.session.user.role !== "admin" &&
        booking.user_id !== req.session.user.id
      ) {
        return apiResponse(res, 403, false, "Access denied.");
      }

      return apiResponse(res, 200, true, "Booking retrieved.", { booking });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/bookings/reference/:reference - Lookup by booking reference
   */
  async getBookingByReference(req, res, next) {
    try {
      const booking = await Booking.findByReference(req.params.reference);
      if (!booking) {
        return apiResponse(res, 404, false, "Booking not found.");
      }

      // Ensure user can only see their own bookings (unless admin)
      if (
        req.session.user.role !== "admin" &&
        booking.user_id !== req.session.user.id
      ) {
        return apiResponse(res, 403, false, "Access denied.");
      }

      // Get full details
      const fullBooking = await Booking.findByIdWithDetails(booking.id);
      return apiResponse(res, 200, true, "Booking retrieved.", {
        booking: fullBooking,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/bookings/:id/cancel - Cancel a booking
   */
  async cancelBooking(req, res, next) {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return apiResponse(res, 404, false, "Booking not found.");
      }

      // Ensure user can only cancel their own bookings (unless admin)
      if (
        req.session.user.role !== "admin" &&
        booking.user_id !== req.session.user.id
      ) {
        return apiResponse(res, 403, false, "Access denied.");
      }

      if (booking.booking_status === "cancelled") {
        return apiResponse(res, 400, false, "Booking is already cancelled.");
      }

      // Check if event date has passed
      if (new Date(booking.event_date) < new Date().setHours(0, 0, 0, 0)) {
        return apiResponse(
          res,
          400,
          false,
          "Cannot cancel bookings for past events.",
        );
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

  /**
   * GET /api/bookings/:id/tickets - Get tickets for a booking
   */
  async getBookingTickets(req, res, next) {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return apiResponse(res, 404, false, "Booking not found.");
      }

      if (
        req.session.user.role !== "admin" &&
        booking.user_id !== req.session.user.id
      ) {
        return apiResponse(res, 403, false, "Access denied.");
      }

      const tickets = await Ticket.findByBookingId(req.params.id);
      return apiResponse(res, 200, true, "Tickets retrieved.", { tickets });
    } catch (err) {
      next(err);
    }
  },
  /**
   * GET /api/booking/stats
   */

  async getAnalytics(req, res) {
    try {
      const { period = "d", startDate, endDate } = req.query;

      // Validate period format: e.g., "d", "2d", "w", "2w", "m", "2m"
      const periodRegex = /^(\d*)([dwm])$/;
      const match = period.match(periodRegex);

      if (!match) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid period format" });
      }

      const interval = parseInt(match[1]) || 1; // default to 1 if no number
      const unit = match[2]; // "d", "w", "m"

      // Validate startDate & endDate
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({
            success: false,
            message: "startDate and endDate are required",
          });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid date format" });
      }

      // ✅ Pass as object
      const data = await bookingStatsService.getDashboardStats({
        period: unit,
        start,
        end,
        interval,
      });

      res.status(200).json({
        success: true,
        period,
        data,
      });
    } catch (error) {
      console.error("Analytics Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = bookingController;
