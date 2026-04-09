const { query, getClient } = require("../../config/db");
const BACKEND_URL = require("../../config/settings");

const Event = {
  /**
   * Create a new event
   */
  async createEvent(data, client) {
    const sql = `
      INSERT INTO events (name, description, event_date, start_time, end_time, capacity, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [
      data.name,
      data.description,
      data.eventDate,
      data.startTime,
      data.endTime,
      data.capacity,
      data.createdBy,
    ];
    const { rows } = await client.query(sql, values);
    return rows[0];
  },

  async createProduct(data, client) {
    const sql = `
      INSERT INTO products (name, product_type, event_id, valid_days)
      VALUES ($1, 'EVENT', $2, $3)
      RETURNING id`;
    const { rows } = await client.query(sql, [
      data.name,
      data.eventId,
      data.validDays,
    ]);
    return rows[0].id;
  },

  /**
   * Find event by ID with its ticket types
   */
  async findEventWithDetails(eventId) {
    const sql = `
    SELECT 
      e.*, 
      p.id AS product_id, 
      p.valid_days,
      -- Subquery for Ticket Types
      (
        SELECT COALESCE(JSON_AGG(tt.* ORDER BY tt.price ASC), '[]')
        FROM ticket_types tt
        WHERE tt.product_id = p.id AND tt.deleted_at IS NULL
      ) AS ticket_types,
      -- Subquery for Media
      (
        SELECT COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', m.id,
              'name', m.name,
              'url', m.url,
              'type', m.type,
              'label', m.label,
              'thumbnailUrl', CASE 
                                WHEN m.thumbnail_url IS NOT NULL THEN m.thumbnail_url 
                                ELSE NULL 
                              END,
              'sort_order', pm.sort_order
            ) ORDER BY pm.sort_order ASC
          ), 
          '[]'
        )
        FROM media m
        JOIN products_media pm ON pm.media_id = m.id
        WHERE pm.product_id = p.id
      ) AS gallery
    FROM events e
    LEFT JOIN products p ON p.event_id = e.id
    WHERE e.id = $1;
  `;

    const result = await query(sql, [eventId]);

    // Since we used subqueries, Postgres returns the row with
    // ticket_types and gallery already as parsed arrays (if using pg driver).
    return result.rows[0] || null;
  },

  /**
   * Get all active events (public)
   */
  async findActiveEvents({ limit, offset }) {
    const sql = `
    SELECT 
      e.*, 
      p.id AS product_id,
      (e.capacity - e.tickets_sold) AS available_tickets,
      -- We use JSON_AGG to build the gallery array directly in Postgres
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'url', m.url, -- Concatenate URL here
            'type', m.type,
              'label', m.label,
              'thumbnailUrl', CASE 
                                WHEN m.thumbnail_url IS NOT NULL THEN m.thumbnail_url 
                                ELSE NULL 
                              END,
            'name', m.name
          )
        ) FILTER (WHERE m.id IS NOT NULL AND m.label = 'poster'), 
        '[]'
      ) AS gallery
    FROM events e
    LEFT JOIN products p ON p.event_id = e.id
    LEFT JOIN products_media pm ON pm.product_id = p.id
    LEFT JOIN media m ON m.id = pm.media_id
    WHERE e.is_active = true AND p.is_active = true AND e.event_date >= CURRENT_DATE
    GROUP BY e.id, p.id -- p.id added to group by since it's in SELECT
    ORDER BY e.event_date ASC
    LIMIT $1 OFFSET $2`;

    const countSql = `
    SELECT COUNT(*) FROM events
    WHERE is_active = true AND event_date >= CURRENT_DATE`;

    const [result, countResult] = await Promise.all([
      query(sql, [limit, offset]),
      query(countSql),
    ]);

    return {
      rows: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  /**
   * Get all events (admin - includes inactive and past)
   */
  async findAll({ limit, offset }) {
    const sql = `
    SELECT 
      e.id, e.name, e.description, e.event_date, e.start_time, e.end_time, 
      e.capacity, e.is_active,
      p.id AS product_id,
      -- Refined Media subquery to build the 'gallery' format
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'url', m.url,
              'type', m.type,
              'label', m.label,
              'thumbnailUrl', CASE 
                                WHEN m.thumbnail_url IS NOT NULL THEN m.thumbnail_url 
                                ELSE NULL 
                              END,
              'name', m.name
            ) ORDER BY pm.sort_order ASC
          ), '[]'
        )
        FROM media m
        JOIN products_media pm ON pm.media_id = m.id
        WHERE pm.product_id = p.id and m.label = 'poster'
      ) AS gallery,
      -- Calculations
      COALESCE(SUM(bi.quantity), 0) AS total_sold,
      (e.capacity - COALESCE(SUM(bi.quantity), 0)) AS available_tickets
    FROM events e
    LEFT JOIN products p ON p.event_id = e.id AND p.product_type = 'EVENT'
    LEFT JOIN ticket_types tt ON tt.product_id = p.id
    LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
    LEFT JOIN bookings b ON bi.booking_id = b.id AND b.status = 'CONFIRMED'
    WHERE p.is_active=true
    GROUP BY e.id, p.id
    ORDER BY e.event_date ASC
    LIMIT $1 OFFSET $2;
  `;

    const result = await query(sql, [limit, offset]);
    return result.rows;
  },

  async countAll() {
    const sql = `SELECT COUNT(*) FROM events`;
    const result = await query(sql);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Update an event
   */
  async updateEvent(id, data, client) {
    const {
      name,
      description,
      eventDate,
      startTime,
      endTime,
      capacity,
      isActive,
    } = data;
    const sql = `
    UPDATE events
    SET name = COALESCE($2, name),
        description = COALESCE($3, description),
        event_date = COALESCE($4, event_date),
        start_time = COALESCE($5, start_time),
        end_time = COALESCE($6, end_time),
        capacity = COALESCE($7, capacity),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
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
    const result = await client.query(sql, values);
    return result.rows[0];
  },

  async syncEventMedia(eventId, mediaIds) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      // 1. Find the product linked to this event
      const productRes = await query(
        "SELECT id FROM products WHERE event_id = $1",
        [eventId],
      );
      if (productRes.rows.length === 0) return;

      const productId = productRes.rows[0].id;

      // 2. Start a transaction-safe sync (Delete old, Insert new)
      // Note: In a real app, wrap this in a BEGIN/COMMIT block
      await query("DELETE FROM products_media WHERE product_id = $1", [
        productId,
      ]);

      if (mediaIds && mediaIds.length > 0) {
        const insertValues = mediaIds
          .map((mediaId, index) => `('${productId}', '${mediaId}', ${index})`)
          .join(",");

        await query(`
      INSERT INTO products_media (product_id, media_id, sort_order) 
      VALUES ${insertValues}
    `);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Deactivate an event (soft delete by deactivating)
   */
  async updateActiveStatus(id, status) {
    const sql = `
      UPDATE events 
      SET is_active = $2, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id, status]);
    return result.rows[0] || null;
  },

  /**
   * Delete an event
   */
  async delete(id) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // 1. Lock the row for the duration of the transaction
      const { rows } = await client.query(
        `SELECT tickets_sold FROM events WHERE id = $1 FOR UPDATE`,
        [id],
      );

      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      if (rows[0].tickets_sold > 0) {
        // SOFT DELETE
        await client.query(
          `UPDATE products SET is_active = false WHERE event_id = $1`,
          [id],
        );
        const result = await client.query(
          `UPDATE events SET is_active = false WHERE id = $1 RETURNING *`,
          [id],
        );
        await client.query("COMMIT");
        return { ...result.rows[0], _softDelete: true };
      }

      // HARD DELETE
      const result = await client.query(
        `DELETE FROM events WHERE id = $1 RETURNING *`,
        [id],
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (err) {
      // Handle FK violation if tickets_sold was 0 but other references exist (like logs)
      if (err.code === "23503") {
        await client.query(
          `UPDATE products SET is_active = false WHERE event_id = $1`,
          [id],
        );
        const result = await client.query(
          `UPDATE events SET is_active = false WHERE id = $1 RETURNING *`,
          [id],
        );
        await client.query("COMMIT");
        return { ...result.rows[0], _softDelete: true };
      }
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async findById(id) {
    const sql = `SELECT * FROM events WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Check availability for an event
   */
  async getEventCapacityStats(id) {
    const sql = `
    SELECT 
      capacity, 
      tickets_sold, 
      (capacity - tickets_sold) AS available
    FROM events 
    WHERE id = $1 AND is_active = true
  `;

    const result = await query(sql, [id]);

    // Return null if no active event is found
    if (result.rows.length === 0) return null;

    return {
      capacity: parseInt(result.rows[0].capacity, 10),
      ticketsSold: parseInt(result.rows[0].tickets_sold, 10),
      available: parseInt(result.rows[0].available, 10),
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
      WHERE p.event_id = $1
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
