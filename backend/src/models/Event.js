const { query, getClient } = require("../config/db");

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
    e.*,
    u.first_name || ' ' || u.last_name AS created_by_name,
    p.id AS product_id,
    -- Calculate total tickets sold across all ticket types for this event's product
    COALESCE(SUM(bi.quantity), 0) AS tickets_sold,
    -- Calculate remaining capacity
    (e.capacity - COALESCE(SUM(bi.quantity), 0)) AS available_tickets
FROM events e
LEFT JOIN users u ON e.created_by = u.id
LEFT JOIN products p ON p.event_id = e.id AND p.product_type = 'EVENT'
LEFT JOIN ticket_types tt ON tt.product_id = p.id
LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
-- Optional: Only count items from confirmed bookings
LEFT JOIN bookings b ON bi.booking_id = b.id AND b.status = 'CONFIRMED'
GROUP BY e.id, u.id, p.id
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

module.exports = Event;
