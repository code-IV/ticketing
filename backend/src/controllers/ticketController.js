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
