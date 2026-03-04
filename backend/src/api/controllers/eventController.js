const { Event } = require("../models/Event");
const { eventStatsService } = require("../services/eventService");
const TicketType = require("../models/TicketType");
const { apiResponse } = require("../../utils/helpers");

const eventController = {
  /**
   * GET /api/events - Get all active upcoming events (public)
   */
  async getActiveEvents(req, res, next) {
    try {
      // Disable caching for events endpoints
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("ETag", ""); // Clear ETag to prevent 304 responses

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await Event.findAllActive({ page, limit });
      return apiResponse(res, 200, true, "Events retrieved.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/events/:id - Get event details with ticket types (public)
   */
  async getEventById(req, res, next) {
    try {
      const event = await Event.findByIdWithTicketTypes(req.params.id);
      if (!event) {
        return apiResponse(res, 404, false, "Event not found.");
      }
      return apiResponse(res, 200, true, "Event retrieved.", { event });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/events/:id/availability - Check availability
   */
  async checkAvailability(req, res, next) {
    try {
      const quantity = parseInt(req.query.quantity, 10) || 1;
      const result = await Event.checkAvailability(req.params.id, quantity);
      return apiResponse(res, 200, true, "Availability checked.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/events/:id/ticket-types - Get ticket types for an event
   */
  async getTicketTypes(req, res, next) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return apiResponse(res, 404, false, "Event not found.");
      }

      const ticketTypes = await TicketType.findByEventId(req.params.id);
      return apiResponse(res, 200, true, "Ticket types retrieved.", {
        ticketTypes,
      });
    } catch (err) {
      next(err);
    }
  },
};

const eventStatsController = {
  async getEventDashboard(req, res) {
    try {
      const { eventId } = req.params;
      const { startDate, endDate, period = "1d" } = req.query;

      const stats = await eventStatsService.getEventAnalytics(eventId, {
        startDate,
        endDate,
        period,
      });

      return apiResponse(res, 200, true, "Ticket types retrieved.", {
        success: true,
        data: stats,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  async getEventStats(req, res) {
    try {
      const { startDate, endDate, period = "1d" } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required." });
      }

      const stats = await eventStatsService.getEventsWithStats(
        startDate,
        endDate,
        period,
      );
      return apiResponse(res, 200, true, "Ticket types retrieved.", stats);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },
};
module.exports = { eventController, eventStatsController };
