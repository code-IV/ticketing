const { getClient } = require("../../config/db");
const { EventRes } = require("../dtos/eventDto");
const { Event, EventStats } = require("../models/Event");
const TicketType = require("../models/TicketType");
const { Sessions, Media } = require("../models/uploads");
const UploadsService = require("./uploadsService");

const EventService = {
  async createEvent(eventData, sessionId) {
    const client = await getClient();
    try {
      const files = sessionId
        ? await UploadsService.validateSession(sessionId)
        : [];
      await client.query("BEGIN");

      // 1. Create Physical Event
      const newEvent = await Event.createEvent(eventData, client);

      // 2. Create Product linked to Event
      const productId = await Event.createProduct(
        {
          name: eventData.name,
          eventId: newEvent.id,
          validDays: eventData.validDays || 1,
        },
        client,
      );

      for (const type of eventData.ticketTypes || []) {
        await TicketType.create({ ...type, productId }, client);
      }
      for (const file of files || []) {
        await Media.createMedia(file, client);
        await Media.linkProductMedia(productId, file.id, client);
      }

      if (sessionId) {
        await Sessions.updateSession(sessionId, client);
      }
      await client.query("COMMIT");
      return { event: newEvent, productId: productId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // events.service.js

  async updateEvent(id, eventData, sessionId) {
    const client = await getClient();
    try {
      const files = sessionId
        ? await UploadsService.validateSession(sessionId)
        : [];
      await client.query("BEGIN");

      // Perform the core update
      const updatedEvent = await Event.updateEvent(id, eventData, client);

      if (!updatedEvent) {
        throw new Error("Event not found");
      }

      for (const type of eventData.ticketTypes || []) {
        await TicketType.update(
          { ...type, productId: eventData.productId },
          client,
        );
      }

      for (const file of files || []) {
        await Media.createMedia(file, client);
        await Media.linkProductMedia(productId, file.id, client);
      }

      if (sessionId) {
        await Sessions.updateSession(sessionId, client);
      }

      await client.query("COMMIT");
      return this.updateEvent;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async deactivateEvent(id) {
    // 1. Business Logic: Check if event exists first
    const event = await Event.findById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    // 2. Business Logic: Prevent deactivating if already inactive (optional)
    if (!event.is_active) {
      return event;
    }

    // 3. Data Access: Call the repository to perform the update
    return await Event.updateActiveStatus(id, false);
  },

  async findAll({ page = 1, limit = 20 }) {
    // 1. Business Logic: Calculate Pagination
    const sanitizedPage = Math.max(1, parseInt(page, 10));
    const sanitizedLimit = Math.max(1, parseInt(limit, 10));
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    // 2. Data Retrieval: Parallel execution for performance
    const [rows, total] = await Promise.all([
      Event.findAll({ limit, offset }),
      Event.countAll(),
    ]);

    // 3. Data Transformation: Final response object
    return {
      events: rows.map((row) => new EventRes(row)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findAllActive({ page = 1, limit = 20 }) {
    // 1. Business Logic / Calculations
    const sanitizedPage = Math.max(1, parseInt(page, 10));
    const sanitizedLimit = Math.max(1, parseInt(limit, 10));
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    // 2. Call Repository
    const { rows, total } = await Event.findActiveEvents({
      limit: sanitizedLimit,
      offset,
    });

    // 3. Transformation / Formatting
    return {
      events: rows.map((row) => new EventRes(row)),
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        total,
        totalPages: Math.ceil(total / sanitizedLimit),
      },
    };
  },

  async getEventById(id) {
    const event = await Event.findEventWithDetails(id);

    if (!event) {
      throw new Error(`Event with ID ${id} not found`);
    }

    // Business Logic: Maybe you want to format the media URLs or calculate total capacity
    return { event: new EventRes(event) };
  },

  async checkAvailability(eventId, requestedQuantity) {
    const eventStats = await Event.getEventCapacityStats(eventId);

    // If event doesn't exist or is inactive
    if (!eventStats) {
      return {
        available: false,
        remaining: 0,
        error: "Event not found or inactive",
      };
    }

    const isAvailable = eventStats.available >= requestedQuantity;

    return {
      available: isAvailable,
      remaining: eventStats.available,
    };
  },

  async deleteById(id) {
    try {
      const rows = await Event.delete(id);
      return rows;
    } catch (error) {
      console.error("delete Event error: ", error);
      throw new Error("Could not retrieve event catalog.");
    }
  },
};

const EventStatsService = {
  async getEventsWithStats(startDate, endDate, period) {
    // Regex to split '2m' into '2' and 'months'
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) throw new Error("Invalid period format. Use e.g., 2d, 3w, 1m");

    const [_, value, unit] = match;
    const unitMap = { d: "days", w: "weeks", m: "months", y: "years" };
    const interval = `${value} ${unitMap[unit]}`;

    return await EventStats.fetchEventsByRange(startDate, endDate, interval);
  },
  async getEventAnalytics(eventId, filters) {
    // 1. Fetch static totals and ticket type breakdown
    const [summary, ticketBreakdown, trends] = await Promise.all([
      EventStats.getEventSummary(eventId),
      EventStats.getTicketTypeStats(eventId),
      EventStats.getTrends(eventId, filters),
    ]);

    return {
      name: summary.name || "",
      revenue: parseFloat(summary.total_revenue || 0),
      ticketsSold: parseInt(summary.tickets_sold || 0),
      capacity: parseInt(summary.capacity || 0),
      revenueTrend: trends.revenueTrend,
      bookingTrend: trends.bookingTrend,
      revenueByTicketType: ticketBreakdown.map((t) => ({
        type: t.type,
        revenue: parseFloat(t.revenue),
      })),
      bookingsByTicketType: ticketBreakdown.map((t) => ({
        type: t.type,
        sold: parseInt(t.sold),
      })),
      ticketTypesTable: ticketBreakdown,
    };
  },
};

module.exports = { EventService, EventStatsService };
