const { query } = require("../../config/db");

const TicketType = {
  /**
   * Create a new ticket type
   */
  async create({ productId, category, price, maxQuantityPerBooking = 10 }, db) {
    const sql = `
      INSERT INTO ticket_types (product_id, category, price, max_quantity)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const values = [productId, category, price, maxQuantityPerBooking];
    const result = await db.query(sql, values);
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
  async update({ category, price, maxQuantityPerBooking, isActive, id }, db) {
    const sql = `
      UPDATE ticket_types
      SET category = COALESCE($2, category),
          price = COALESCE($3, price),
          max_quantity = COALESCE($4, max_quantity),
          is_active = COALESCE($5, is_active)
      WHERE id = $1
      RETURNING *`;
    const values = [id, category, price, maxQuantityPerBooking, isActive];
    const result = await db.query(sql, values);
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
