const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const { apiResponse } = require('../utils/helpers');

const eventController = {
  /**
   * GET /api/events - Get all active upcoming events (public)
   */
  async getActiveEvents(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await Event.findAllActive({ page, limit });
      return apiResponse(res, 200, true, 'Events retrieved.', result);
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
        return apiResponse(res, 404, false, 'Event not found.');
      }
      return apiResponse(res, 200, true, 'Event retrieved.', { event });
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
      return apiResponse(res, 200, true, 'Availability checked.', result);
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
        return apiResponse(res, 404, false, 'Event not found.');
      }

      const ticketTypes = await TicketType.findByEventId(req.params.id);
      return apiResponse(res, 200, true, 'Ticket types retrieved.', { ticketTypes });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = eventController;
