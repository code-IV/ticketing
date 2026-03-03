const { ticketService } = require("../services/ticketService");
const { apiResponse } = require("../../utils/helpers");

const TicketController = {
  /**
   * GET /api/tickets/:id - Get ticket by ID
   */
  async getTicketById(req, res, next) {
    try {
      const ticket = await ticketService.findById(req.params.id);
      if (!ticket) {
        return apiResponse(res, 404, false, "Ticket not found.");
      }
      return apiResponse(res, 200, true, "Ticket retrieved.", { ticket });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/tickets/code/:code - Get ticket by code
   */
  async getTicketByCode(req, res, next) {
    try {
      const ticket = await ticketService.findByCode(req.params.code);
      if (!ticket) {
        return apiResponse(res, 404, false, "Ticket not found.");
      }

      // Visitors can only view their own tickets
      if (
        req.session.user.role !== "admin" &&
        ticket.user_id !== req.session.user.id
      ) {
        return apiResponse(res, 403, false, "Access denied.");
      }

      return apiResponse(res, 200, true, "Ticket retrieved.", { ticket });
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

      const result = await ticketService.findByUserId(userId, { page, limit });
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

      const tickets = await ticketService.findByGameId(userId, gameId);

      if (tickets.length === 0) {
        return apiResponse(res, 404, false, "No tickets found for this game");
      }

      // Group by game to get game info
      const game = tickets[0].game;

      return apiResponse(res, 200, true, "Game tickets details retrieved.", {
        game,
        tickets,
      });
    } catch (err) {
      next(err);
    }
  },
  /**
   * GET /api/tickets/scan/:token
   */
  async scanTicket(req, res, next) {
    try {
      const token = req.params.token;

      if (!token) {
        return apiResponse(res, 400, false, "QR token is required.", {
          valid: false,
          reason: "MISSING_TOKEN",
        });
      }

      const result = await ticketService.scan(token);

      if (!result.success) {
        return apiResponse(res, 400, false, "Ticket scan failed.", {
          valid: false,
          reason: result.error,
        });
      }

      const { ticket, ticket_passes } = result.data;

      return apiResponse(res, 200, true, "Ticket scan successful.", {
        valid: true,
        ticket: {
          id: ticket.id,
          ticket_code: ticket.ticket_code,
          status: ticket.status,
          expires_at: ticket.expires_at,
          booking_reference: ticket.booking_reference,
          guest_name: ticket.guest_name,
          guest_email: ticket.guest_email,
          ticket_passes: ticket_passes.map((e) => ({
            product_id: e.product_id,
            product_name: e.name,
            product_type: e.product_type,
            total_quantity: e.total_quantity,
            used_quantity: e.used_quantity,
            remaining_quantity: e.total_quantity - e.used_quantity,
            status: e.status,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },
  /**
   * POST api/ticket/punch  punch ticket pass
   * Body {ticketId, productId}
   */
  async punchTicketPass(req, res, next) {
    try {
      const { ticketId, productId } = req.body;

      if (!productId || ticketId) {
        return apiResponse(
          res,
          400,
          false,
          "Product ID and Ticker ID are required.",
          {
            success: false,
            reason: "MISSING_FIELDS",
          },
        );
      }

      const result = await ticketService.punchPass(ticketId, productId);

      if (!result.success) {
        return apiResponse(res, 400, false, "Consumption failed.", {
          success: false,
          reason: result.error,
        });
      }

      const e = result.data;

      const responseModel = {
        success: true,
        ticket_pass: {
          ticket_id: e.ticket_id,
          product_id: e.product_id,
          total_quantity: e.total_quantity,
          used_quantity: e.used_quantity,
          remaining_quantity: e.total_quantity - e.used_quantity,
          status: e.status,
        },
      };

      return apiResponse(
        res,
        200,
        true,
        "Pass consumed successfully.",
        responseModel,
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/tickets/validate/:code - Validate a ticket at park entry (admin/gate)
   */
  async validateTicket(req, res, next) {
    try {
      const result = await ticketService.validate(req.params.code);

      if (!result.valid) {
        return apiResponse(
          res,
          400,
          false,
          `Ticket validation failed: ${result.reason}`,
          {
            valid: false,
            reason: result.reason,
            usedAt: result.usedAt || null,
          },
        );
      }

      return apiResponse(res, 200, true, "Ticket validated successfully.", {
        valid: true,
        ticket: result.ticket,
      });
    } catch (err) {
      next(err);
    }
  },
};
module.exports = TicketController;
