const { query, getClient } = require("../../config/db");

const Event = {
  /**
   * Create a new event
   */
  async create({
    name,
    description,
    eventDate,
    startTime,
    endTime,
    capacity,
    createdBy,
    validDays = 1, // Default validity for event tickets
  }) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // 1. Insert the physical Event
      const eventSql = `
      INSERT INTO events (name, description, event_date, start_time, end_time, capacity, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;

      const eventValues = [
        name,
        description,
        eventDate,
        startTime,
        endTime,
        capacity,
        createdBy,
      ];
      const eventResult = await client.query(eventSql, eventValues);
      const newEvent = eventResult.rows[0];

      // 2. Automatically create a Product for this event
      // This allows ticket_types to be attached to it
      const productSql = `
      INSERT INTO products (name, product_type, event_id, valid_days)
      VALUES ($1, 'EVENT', $2, $3)
      RETURNING id`;

      const productResult = await client.query(productSql, [
        name,
        newEvent.id,
        validDays,
      ]);

      // Attach the product_id to the event object returned to the frontend
      newEvent.product_id = productResult.rows[0].id;

      await client.query("COMMIT");
      return newEvent;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating event and product:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Find event by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM events WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find event by ID with its ticket types
   */
  async findByIdWithTicketTypes(id) {
    const eventSql = `SELECT * FROM events WHERE id = $1`;
    const eventResult = await query(eventSql, [id]);
    const event = eventResult.rows[0];
    if (!event) return null;

    const ticketTypesSql = `
      SELECT tt.*, 
        p.name as product_name,
        p.product_type
      FROM ticket_types tt
      JOIN products p ON tt.product_id = p.id
      WHERE p.event_id = $1
        AND p.is_active = true
      ORDER BY tt.price ASC;`;
    const ticketTypesResult = await query(ticketTypesSql, [id]);

    return {
      ...event,
      ticket_types: ticketTypesResult.rows,
    };
  },

  /**
   * Get all active events (public)
   */
  async findAllActive({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT e.*, 
             (e.capacity - e.tickets_sold) AS available_tickets
      FROM events e
      WHERE e.is_active = true AND e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC
      LIMIT $1 OFFSET $2`;
    const result = await query(sql, [limit, offset]);

    const countSql = `
      SELECT COUNT(*) FROM events
      WHERE is_active = true AND event_date >= CURRENT_DATE`;
    const countResult = await query(countSql);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      events: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all events (admin - includes inactive and past)
   */
  async findAll({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT 
    e.id, e.name, e.description, e.event_date, e.start_time, e.end_time, e.capacity, e.is_active, e.tickets_sold,
    p.id AS product_id,
    -- Calculate total tickets sold across all ticket types for this event's product
    COALESCE(SUM(bi.quantity), 0) AS tickets_sold,
    -- Calculate remaining capacity
    (e.capacity - COALESCE(SUM(bi.quantity), 0)) AS available_tickets
FROM events e
LEFT JOIN products p ON p.event_id = e.id AND p.product_type = 'EVENT'
LEFT JOIN ticket_types tt ON tt.product_id = p.id
LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
-- Optional: Only count items from confirmed bookings
LEFT JOIN bookings b ON bi.booking_id = b.id AND b.status = 'CONFIRMED'
GROUP BY e.id, p.id
ORDER BY e.event_date DESC
LIMIT $1 OFFSET $2;`;
    const result = await query(sql, [limit, offset]);

    const countSql = `SELECT COUNT(*) FROM events`;
    const countResult = await query(countSql);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      events: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update an event
   */
  async update(
    id,
    { name, description, eventDate, startTime, endTime, capacity, isActive },
  ) {
    const sql = `
      UPDATE events
      SET name = COALESCE($2, name),
          description = COALESCE($3, description),
          event_date = COALESCE($4, event_date),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          capacity = COALESCE($7, capacity),
          is_active = COALESCE($8, is_active)
      WHERE id = $1
      RETURNING *`;
    const values = [
      id,
      name,
      description,
      eventDate,
      startTime,
      endTime,
      capacity,
      isActive,
    ];
    const result = await query(sql, values);
    return result.rows[0] || null;
  },

  /**
   * Delete an event (soft delete by deactivating)
   */
  async deactivate(id) {
    const sql = `UPDATE events SET is_active = false WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Check availability for an event
   */
  async checkAvailability(id, requestedQuantity) {
    const sql = `
      SELECT capacity, tickets_sold, (capacity - tickets_sold) AS available
      FROM events WHERE id = $1 AND is_active = true`;
    const result = await query(sql, [id]);
    if (!result.rows[0]) return { available: false, remaining: 0 };

    const { available } = result.rows[0];
    return {
      available: available >= requestedQuantity,
      remaining: parseInt(available, 10),
    };
  },

  /**
   * Increment tickets sold count
   */
  async incrementTicketsSold(id, quantity) {
    const sql = `
      UPDATE events
      SET tickets_sold = tickets_sold + $2
      WHERE id = $1 AND (tickets_sold + $2) <= capacity
      RETURNING *`;
    const result = await query(sql, [id, quantity]);
    return result.rows[0] || null;
  },

  /**
   * Decrement tickets sold count (for cancellations)
   */
  async decrementTicketsSold(id, quantity) {
    const sql = `
      UPDATE events
      SET tickets_sold = GREATEST(tickets_sold - $2, 0)
      WHERE id = $1
      RETURNING *`;
    const result = await query(sql, [id, quantity]);
    return result.rows[0] || null;
  },
};
const EventStats = {
  async fetchEventsByRange(startDate, endDate, interval) {
    const sql = `
    SELECT 
      e.id,
      e.name,
      e.event_date as date,
      e.capacity,
      COALESCE(SUM(bi.quantity), 0) as "ticketsSold",
      COALESCE(SUM(bi.subtotal), 0) as revenue,
      e.is_active as status
    FROM events e
    LEFT JOIN products p ON p.event_id = e.id
    LEFT JOIN ticket_types tt ON tt.product_id = p.id
    LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
    LEFT JOIN bookings b ON bi.booking_id = b.id AND b.status = 'CONFIRMED'
    WHERE true
    GROUP BY e.id
    ORDER BY e.event_date ASC;
  `;

    const result = await query(sql);

    // Note: For the "granularity" part, if the frontend dev wants a list
    // grouped BY the period (e.g. Total Revenue every 2 weeks),
    // we would use generate_series here.

    return result.rows;
  },
  async getEventSummary(eventId) {
    const sql = `
      SELECT 
        e.capacity,
        e.name,
        SUM(bi.quantity) as tickets_sold,
        SUM(bi.subtotal) as total_revenue
      FROM events e
      LEFT JOIN products p ON p.event_id = e.id
      LEFT JOIN ticket_types tt ON tt.product_id = p.id
      LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
      LEFT JOIN bookings b ON bi.booking_id = b.id AND b.status = 'CONFIRMED'
      WHERE e.id = $1
      GROUP BY e.name,
      e.capacity`;
    const res = await query(sql, [eventId]);
    return res.rows[0] || {};
  },

  async getTicketTypeStats(eventId) {
    const sql = `
      SELECT 
        tt.id,
        tt.category as type,
        tt.price as "avgPrice",
        COALESCE(SUM(bi.quantity), 0) as sold,
        COALESCE(SUM(bi.subtotal), 0) as revenue
      FROM ticket_types tt
      JOIN products p ON tt.product_id = p.id
      LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
      LEFT JOIN bookings b ON bi.booking_id = b.id AND b.status = 'CONFIRMED'
      WHERE p.event_id = $1
      GROUP BY tt.id, tt.category, tt.price`;
    const res = await query(sql, [eventId]);
    return res.rows;
  },

  async getTrends(eventId, { startDate, endDate, period }) {
    // Helper to convert '2d' to '2 days'
    const unitMap = { d: "days", w: "weeks", m: "months" };
    const num = period.match(/\d+/)?.[0] || 1;
    const unit = unitMap[period.match(/[a-z]+/)?.[0]] || "days";
    const interval = `${num} ${unit}`;

    const sql = `
      WITH date_series AS (
        SELECT generate_series($2::timestamp, $3::timestamp, $4::interval) as slot
      )
      SELECT 
        ds.slot as date,
        COALESCE(SUM(bi.subtotal), 0) as revenue,
        COALESCE(SUM(bi.quantity), 0) as bookings
      FROM date_series ds
      LEFT JOIN bookings b ON b.status = 'CONFIRMED' 
        AND b.created_at >= ds.slot 
        AND b.created_at < ds.slot + $4::interval
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      LEFT JOIN ticket_types tt ON bi.ticket_type_id = tt.id
      LEFT JOIN products p ON tt.product_id = p.id
      WHERE p.event_id = $1 OR p.event_id IS NULL
      GROUP BY ds.slot
      ORDER BY ds.slot ASC`;

    const res = await query(sql, [eventId, startDate, endDate, interval]);

    return {
      revenueTrend: res.rows.map((r) => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
      })),
      bookingTrend: res.rows.map((r) => ({
        date: r.date,
        bookings: parseInt(r.bookings),
      })),
    };
  },
};
module.exports = { Event, EventStats };
