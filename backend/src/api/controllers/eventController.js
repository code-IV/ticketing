const { Event } = require("../models/Event");
const { EventService, EventStatsService } = require("../services/eventService");
const TicketType = require("../models/TicketType");
const { apiResponse } = require("../../utils/helpers");
const { query } = require("../../config/db");

const EventController = {
  /**
   * GET /api/admin/events - Get all events (including inactive/past)
   */
  async getAllEvents(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await EventService.findAll({ page, limit });
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
      const { event, sessionId } = req.body;
      const userId = req.session.user.id;

      const result = await EventService.createEvent(
        { ...event, userId },
        sessionId,
      );
      return apiResponse(res, 201, true, "Event created successfully.", result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/events-with-tickets
   * Updated for the Product Catalog Model ///////////////////////////////////////////////////////////////////////////////////////////////////
   */
  async createEventWithTicketTypes(req, res, next) {
    try {
      const {
        name,
        eventDate,
        startTime,
        endTime,
        capacity,
        ticketTypes, // Array of { category, price }
      } = req.body;

      await query("BEGIN");

      // 1. Create the Physical Event
      const eventRes = await query(
        `INSERT INTO events (name, event_date, start_time, end_time, capacity)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name`,
        [name, eventDate, startTime, endTime, capacity],
      );
      const event = eventRes.rows[0];

      // 2. Create the Product Wrapper (This makes it "Purchasable")
      const productRes = await query(
        `INSERT INTO products (name, product_type, event_id, valid_days)
         VALUES ($1, 'EVENT', $2, 1) RETURNING id`,
        [event.name, event.id],
      );
      const productId = productRes.rows[0].id;

      // 3. Create Ticket Types (Linked to Product, not Event)
      const createdTicketTypes = [];
      for (const tt of ticketTypes) {
        const ttRes = await query(
          `INSERT INTO ticket_types (product_id, category, price)
           VALUES ($1, $2, $3) RETURNING *`,
          [productId, tt.category.toUpperCase(), tt.price],
        );
        createdTicketTypes.push(ttRes.rows[0]);
      }

      await query("COMMIT");

      return apiResponse(
        res,
        201,
        true,
        "Event product created successfully.",
        {
          event,
          productId,
          ticketTypes: createdTicketTypes,
        },
      );
    } catch (err) {
      await query("ROLLBACK");
      next(err);
    }
  },

  /**
   * PATCH /api/admin/events/:id - Update an event
   */
  async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      const { event, sessionId } = req.body;

      const existing = await Event.findById(id);
      if (!existing) {
        return apiResponse(res, 404, false, "Event not found.");
      }

      const result = await EventService.updateEvent(id, event, sessionId);

      return apiResponse(res, 200, true, "Event updated successfully.", {
        result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/events/:id - Update an event with ticket types///////////////////////////////////////////////////////////////////////
   */
  async updateEventWithTicketTypes(req, res, next) {
    const { query } = require("../../config/db");

    try {
      const {
        name,
        event_date,
        start_time,
        end_time,
        capacity,
        ticketTypes, // Array of { id?, category, price }
      } = req.body;

      await query("BEGIN");

      // 1. Update the Physical Event
      const eventResult = await query(
        `UPDATE events 
       SET name = $1, event_date = $2, start_time = $3, end_time = $4, capacity = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
        [name, event_date, start_time, end_time, capacity, req.params.id],
      );

      if (eventResult.rowCount === 0) {
        await query("ROLLBACK");
        return apiResponse(res, 404, false, "Event not found.");
      }

      // 2. Sync the Product Wrapper
      // We ensure a Product exists for this event and update its name to match
      let productResult = await query(
        `UPDATE products SET name = $1 WHERE event_id = $2 RETURNING id`,
        [name, req.params.id],
      );

      let productId;
      if (productResult.rowCount === 0) {
        // Fallback: Create product if it was missing
        const newProduct = await query(
          `INSERT INTO products (name, product_type, event_id) VALUES ($1, 'EVENT', $2) RETURNING id`,
          [name, req.params.id],
        );
        productId = newProduct.rows[0].id;
      } else {
        productId = productResult.rows[0].id;
      }

      // 3. Sync Ticket Types (Prices)
      const existingTicketTypes = await query(
        `SELECT id FROM ticket_types WHERE product_id = $1`,
        [productId],
      );
      const existingIds = existingTicketTypes.rows.map((t) => t.id);

      const submittedIds = [];

      for (const tt of ticketTypes) {
        if (tt.id && existingIds.includes(tt.id)) {
          // UPDATE existing price
          await query(
            `UPDATE ticket_types SET category = $1, price = $2, updated_at = NOW() WHERE id = $3`,
            [tt.category.toUpperCase(), tt.price, tt.id],
          );
          submittedIds.push(tt.id);
        } else {
          // INSERT new price
          const newTt = await query(
            `INSERT INTO ticket_types (product_id, category, price) VALUES ($1, $2, $3) RETURNING id`,
            [productId, tt.category.toUpperCase(), tt.price],
          );
          submittedIds.push(newTt.rows[0].id);
        }
      }

      // 4. DELETE (or Deactivate) ticket types not in the new list
      const idsToDelete = existingIds.filter(
        (id) => !submittedIds.includes(id),
      );
      if (idsToDelete.length > 0) {
        await query(`DELETE FROM ticket_types WHERE id = ANY($1)`, [
          idsToDelete,
        ]);
      }

      await query("COMMIT");

      return apiResponse(
        res,
        200,
        true,
        "Event and Pricing updated successfully.",
      );
    } catch (err) {
      await query("ROLLBACK");
      next(err);
    }
  },

  /**
   * POST /api/admin/events/:id - Deactivate an event
   */
  async deactivateEvent(req, res, next) {
    try {
      const event = await EventService.deactivateEvent(req.params.id);
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
  /**
   * DELETE /api/admin/events/:id - Deactivate an event
   */
  async deleteEvent(req, res, next) {
    try {
      const event = await EventService.deleteById(req.params.id);
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
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

      const result = await EventService.findAllActive({ page, limit });

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
      const event = await EventService.getEventById(req.params.id);
      if (!event) {
        return apiResponse(res, 404, false, "Event not found.");
      }
      return apiResponse(res, 200, true, "Event retrieved.", event);
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
      const result = await EventService.checkAvailability(
        req.params.id,
        quantity,
      );
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

const EventStatsController = {
  async getEventDashboard(req, res) {
    try {
      const { eventId } = req.params;
      const { startDate, endDate, period = "1d" } = req.query;

      const stats = await EventStatsService.getEventAnalytics(eventId, {
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

      const stats = await EventStatsService.getEventsWithStats(
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
module.exports = { EventController, EventStatsController };
