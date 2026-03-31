const { query, getClient } = require("../../config/db");

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
      WHERE event_id = $1 AND deleted_at IS NULL
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
    const values = [id, productId, category, price, maxQuantityPerBooking];
    const result = await db.query(sql, values);
    return result.rows[0] || null;
  },

  /**
   * Delete / deactivate a ticket type
   */
  async delete(id) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      const check = await client.query(
        `SELECT 1 FROM booking_items WHERE ticket_type_id = $1 LIMIT 1`,
        [id],
      );

      if (check.rowCount > 0) {
        const softDeleteResult = await client.query(
          `UPDATE ticket_types SET deleted_at = now() WHERE id = $1 RETURNING *`,
          [id],
        );
        await client.query("COMMIT");
        return { ...softDeleteResult.rows[0], _softDelete: true };
      }

      // 1. Try a Hard Delete first
      const result = await client.query(
        `DELETE FROM ticket_types WHERE id = $1 RETURNING *`,
        [id],
      );

      // If nothing was deleted (id didn't exist)
      if (result.rowCount === 0) {
        await client.query("COMMIT");
        return null;
      }

      await client.query("COMMIT");
      return { ...result.rows[0], _softDelete: false };
    } catch (err) {
      // 2. If Foreign Key violation (23503), perform Soft Delete
      if (err.code === "23503") {
        const softDeleteResult = await client.query(
          `UPDATE ticket_types SET deleted_at = now() WHERE id = $1 RETURNING *`,
          [id],
        );
        await client.query("COMMIT");
        return { ...softDeleteResult.rows[0], _softDelete: true };
      }

      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = TicketType;
