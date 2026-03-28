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
  async update({ category, price, maxQuantityPerBooking, productId, id }, db) {
    const sql = `
      INSERT INTO ticket_types (id, product_id, category, price, max_quantity)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5)
      ON CONFLICT (id)
      DO UPDATE SET 
          product_id = COALESCE(EXCLUDED.product_id, ticket_types.product_id),
          category = COALESCE(EXCLUDED.category, ticket_types.category),
          price = COALESCE(EXCLUDED.price, ticket_types.price),
          max_quantity = COALESCE(EXCLUDED.max_quantity, ticket_types.max_quantity)
      RETURNING *`;
    const values = [null, productId, category, price, maxQuantityPerBooking];
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
