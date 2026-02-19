const { query } = require('../config/db');

const TicketType = {
  /**
   * Create a new ticket type
   */
  async create({ eventId, name, category, price, description, maxQuantityPerBooking = 10 }) {
    const sql = `
      INSERT INTO ticket_types (event_id, name, category, price, description, max_quantity_per_booking)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const values = [eventId, name, category, price, description, maxQuantityPerBooking];
    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Find ticket type by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM ticket_types WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find all ticket types for an event
   */
  async findByEventId(eventId) {
    const sql = `
      SELECT * FROM ticket_types
      WHERE event_id = $1 AND is_active = true
      ORDER BY price ASC`;
    const result = await query(sql, [eventId]);
    return result.rows;
  },

  /**
   * Update a ticket type
   */
  async update(id, { name, category, price, description, maxQuantityPerBooking, isActive }) {
    const sql = `
      UPDATE ticket_types
      SET name = COALESCE($2, name),
          category = COALESCE($3, category),
          price = COALESCE($4, price),
          description = COALESCE($5, description),
          max_quantity_per_booking = COALESCE($6, max_quantity_per_booking),
          is_active = COALESCE($7, is_active)
      WHERE id = $1
      RETURNING *`;
    const values = [id, name, category, price, description, maxQuantityPerBooking, isActive];
    const result = await query(sql, values);
    return result.rows[0] || null;
  },

  /**
   * Delete (deactivate) a ticket type
   */
  async deactivate(id) {
    const sql = `UPDATE ticket_types SET is_active = false WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },
};

module.exports = TicketType;
