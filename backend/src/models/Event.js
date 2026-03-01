const { query } = require("../config/db");

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
  }) {
    const sql = `
      INSERT INTO events (name, description, event_date, start_time, end_time, capacity, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [
      name,
      description,
      eventDate,
      startTime,
      endTime,
      capacity,
      createdBy,
    ];
    const result = await query(sql, values);
    return result.rows[0];
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
      SELECT e.*,
             (e.capacity - e.tickets_sold) AS available_tickets,
             u.first_name || ' ' || u.last_name AS created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date DESC
      LIMIT $1 OFFSET $2`;
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
