const Ticket = require('../models/Ticket');
const { apiResponse } = require('../utils/helpers');

const ticketController = {
  /**
   * GET /api/tickets/:id - Get ticket by ID
   */
  async getTicketById(req, res, next) {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) {
        return apiResponse(res, 404, false, 'Ticket not found.');
      }
      return apiResponse(res, 200, true, 'Ticket retrieved.', { ticket });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/tickets/code/:code - Get ticket by code
   */
  async getTicketByCode(req, res, next) {
    try {
      const ticket = await Ticket.findByCode(req.params.code);
      if (!ticket) {
        return apiResponse(res, 404, false, 'Ticket not found.');
      }

      // Visitors can only view their own tickets
      if (req.session.user.role !== 'admin' && ticket.user_id !== req.session.user.id) {
        return apiResponse(res, 403, false, 'Access denied.');
      }

      return apiResponse(res, 200, true, 'Ticket retrieved.', { ticket });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/tickets/my - Get current user's game tickets
   */
  async getMyTickets(req, res, next) {
    try {
      // Disable caching for tickets endpoints
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.removeHeader("ETag");

      const userId = req.session.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

      const result = await Ticket.findByUserId(userId, { page, limit });
      return apiResponse(res, 200, true, "Game tickets retrieved.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/tickets/game/:gameId - Get all tickets for a specific game
   */
  async getGameTicketsDetails(req, res, next) {
    try {
      // Disable caching for tickets endpoints
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.removeHeader("ETag");

      const userId = req.session.user.id;
      const gameId = req.params.gameId;

      const tickets = await Ticket.findByGameId(userId, gameId);
      
      if (tickets.length === 0) {
        return apiResponse(res, 404, false, "No tickets found for this game");
      }

      // Group by game to get game info
      const game = tickets[0].game;
      
      return apiResponse(res, 200, true, "Game tickets details retrieved.", {
        game,
        tickets
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/tickets/validate/:code - Validate a ticket at park entry (admin/gate)
   */
  async validateTicket(req, res, next) {
    try {
      const result = await Ticket.validate(req.params.code);

      if (!result.valid) {
        return apiResponse(res, 400, false, `Ticket validation failed: ${result.reason}`, {
          valid: false,
          reason: result.reason,
          usedAt: result.usedAt || null,
        });
      }

      return apiResponse(res, 200, true, 'Ticket validated successfully.', {
        valid: true,
        ticket: result.ticket,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ticketController;
