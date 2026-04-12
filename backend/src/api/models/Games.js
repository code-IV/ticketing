const { query, getClient } = require("../../config/db");
const BACKEND_URL = require("../../config/settings");

const Game = {
  async createGame(client, { name, description, rules, status }) {
    const sql = `
    INSERT INTO games (name, description, rules, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, status
  `;
    const { rows } = await client.query(sql, [
      name,
      description,
      rules,
      status || "OPEN",
    ]);
    return rows[0];
  },

  async createProduct(client, { name, gameId }) {
    const sql = `
    INSERT INTO products (name, product_type, game_id, is_active)
    VALUES ($1, 'GAME', $2, true)
    RETURNING id
  `;
    const { rows } = await client.query(sql, [name, gameId]);
    return rows[0].id;
  },

  async updateGame(client, id, { name, description, rules, status }) {
    const sql = `
    UPDATE games 
    SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      rules = COALESCE($4, rules),
      status = COALESCE($5, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
    const { rows } = await client.query(sql, [
      id,
      name,
      description,
      rules,
      status,
    ]);
    return rows[0];
  },

  async findAll() {
    const sql = `
    SELECT 
      g.id, g.name, g.description, g.rules, g.status, g.created_at,
      -- Aggregate Ticket Types
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', tt.id,
          'category', tt.category,
          'price', tt.price
        )) FROM ticket_types tt WHERE tt.product_id = p.id AND tt.deleted_at IS NULL),
        '[]'
      ) AS ticket_types,
      -- Aggregate Media Gallery
      COALESCE(
        (SELECT json_agg(json_build_object(
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
        ) ORDER BY pm.sort_order ASC) 
         FROM media m
         JOIN products_media pm ON pm.media_id = m.id
         WHERE pm.product_id = p.id AND m.label='poster'),
        '[]'
      ) AS gallery
    FROM games g
    LEFT JOIN products p ON g.id = p.game_id
    WHERE p.is_active=true
    ORDER BY g.created_at DESC;
  `;

    const result = await query(sql);

    // Optional: Map the URL to include the BACKEND_URL prefix if needed
    return result.rows;
  },

  async findActive() {
    const sql = `
    SELECT 
  g.id, g.name, g.description, g.rules, g.status,
  p.id AS product_id,
  -- Aggregate Ticket Types + their discounts
  COALESCE(
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', tt.id,
          'category', tt.category,
          'price', tt.price
        )
      )
      FROM ticket_types tt
      WHERE tt.product_id = p.id
        AND tt.deleted_at IS NULL
    ),
    '[]'
  ) AS ticket_types,

  -- Gallery (unchanged)
  COALESCE(
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', m.id,
          'url', m.url,
          'type', m.type,
          'label', m.label,
          'thumbnailUrl',
            CASE WHEN m.thumbnail_url IS NOT NULL THEN m.thumbnail_url ELSE NULL END,
          'name', m.name,
          'sort_order', pm.sort_order
        )
        ORDER BY pm.sort_order ASC
      )
      FROM media m
      JOIN products_media pm ON pm.media_id = m.id
      WHERE pm.product_id = p.id
    ),
    '[]'
  ) AS gallery

FROM games g
LEFT JOIN products p ON g.id = p.game_id
WHERE g.status = 'OPEN' AND p.is_active = true
ORDER BY g.created_at DESC;
  `;

    const result = await query(sql);

    // Optional: If you need to prepend the BACKEND_URL in JS
    return result.rows;
  },

  async findById(id) {
    const sql = `
    WITH ticket_agg AS (
    SELECT 
        product_id,
        COALESCE(
            JSONB_AGG(JSONB_BUILD_OBJECT(
                'id', id,
                'category', category,
                'price', price
            )) FILTER (WHERE id IS NOT NULL AND deleted_at IS NULL), 
            '[]'
        ) AS ticket_types
    FROM ticket_types
    GROUP BY product_id
),
media_agg AS (
    SELECT 
        pm.product_id,
        COALESCE(
            JSONB_AGG(JSONB_BUILD_OBJECT(
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
            ) ORDER BY pm.sort_order ASC) FILTER (WHERE m.id IS NOT NULL), 
            '[]'
        ) AS gallery
    FROM products_media pm
    JOIN media m ON pm.media_id = m.id
    GROUP BY pm.product_id
),
product_details AS (
    SELECT 
        p.game_id,
        p.id AS product_id,
        COALESCE(ta.ticket_types, '[]') AS ticket_types,
        COALESCE(ma.gallery, '[]') AS gallery
    FROM products p
    LEFT JOIN ticket_agg ta ON p.id = ta.product_id
    LEFT JOIN media_agg ma ON p.id = ma.product_id
)
SELECT 
    g.*, 
    pd.product_id,
    pd.ticket_types,
    pd.gallery
FROM games g
LEFT JOIN product_details pd ON g.id = pd.game_id
WHERE g.id = $1;
  `;

    const result = await query(sql, [id]);
    return result.rows[0];
  },

  async deleteGame(id) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      const checkRes = await client.query(
        `SELECT 
            p.id AS product_id,
            EXISTS (
              SELECT 1 FROM ticket_products tp WHERE tp.product_id = p.id LIMIT 1
            ) AS has_tickets
          FROM products p
          WHERE p.game_id = $1`,
        [id],
      );

      const product = checkRes.rows[0];

      if (product) {
        if (product.has_tickets) {
          // 3. SOFT DELETE: Tickets exist
          const softDeleteRes = await client.query(
            `UPDATE products SET is_active = false WHERE id = $1 RETURNING *`,
            [product.product_id],
          );
          await client.query("COMMIT");
          return { ...softDeleteRes.rows[0], _softDelete: true };
        }
      }

      // 4. HARD DELETE: No tickets exist, try to wipe the game
      const deleteRes = await client.query(
        `DELETE FROM games WHERE id = $1 RETURNING *`,
        [id],
      );

      await client.query("COMMIT");
      return deleteRes.rows[0] || null;
    } catch (err) {
      await client.query("ROLLBACK");

      // Handle unexpected Foreign Key violations (safety net)
      if (err.code === "23503") {
        const fallbackRes = await client.query(
          `UPDATE products SET is_active = false WHERE game_id = $1 RETURNING *`,
          [id],
        );
        return { ...fallbackRes.rows[0], _softDelete: true };
      }

      throw err;
    } finally {
      client.release();
    }
  },
};

const GameStats = {
  async getRawGameStats(startDate, endDate) {
    const sql = `
    SELECT 
      g.id,
      g.name,
      g.status,
      COALESCE(SUM(bi.subtotal), 0) as total_revenue,
      COALESCE(SUM(bi.quantity), 0) as tickets_sold,
      -- Fetch the most popular ticket type for this game
      (SELECT tt.category 
       FROM booking_items bi2 
       JOIN ticket_types tt ON bi2.ticket_type_id = tt.id
       JOIN products p2 ON tt.product_id = p2.id
       WHERE p2.game_id = g.id 
       GROUP BY tt.category 
       ORDER BY SUM(bi2.quantity) DESC LIMIT 1) as top_ticket_type,
      (SELECT tt.price 
       FROM ticket_types tt 
       JOIN products p2 ON tt.product_id = p2.id
       WHERE p2.game_id = g.id 
       ORDER BY tt.price DESC LIMIT 1) as top_ticket_price
    FROM games g
    LEFT JOIN products p ON g.id = p.game_id
    LEFT JOIN ticket_types tt ON p.id = tt.product_id
    LEFT JOIN booking_items bi ON tt.id = bi.ticket_type_id
    LEFT JOIN bookings b ON bi.booking_id = b.id
    WHERE (b.status = 'CONFIRMED' OR b.status IS NULL)
      AND ((b.created_at >= $1 AND b.created_at <= $2) OR b.created_at IS NULL)
    GROUP BY g.id;
  `;
    const res = await query(sql, [startDate, endDate]);
    return res.rows;
  },
  async getGameSummary(gameId, { startDate, endDate }) {
    const sql = `
    SELECT 
      p.name,
      SUM(bi.subtotal) as total_revenue,
      SUM(bi.quantity) as total_bookings
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN products p ON tt.product_id = p.id
    JOIN payments pay ON bi.booking_id = pay.booking_id
    WHERE p.game_id = $1 
      AND pay.status = 'COMPLETED'
      AND pay.paid_at BETWEEN $2 AND $3
    GROUP BY p.name;
  `;
    const res = await query(sql, [gameId, startDate, endDate]);
    return res.rows[0] || {};
  },

  async getTrends(gameId, { startDate, endDate, fullInterval }) {
    // This query generates a series of dates and joins sales onto them
    const sql = `
    WITH date_series AS (
      SELECT generate_series($2::timestamp, $3::timestamp, $4::interval) as period_start
    )
    SELECT 
      ds.period_start,
      COALESCE(SUM(bi.subtotal), 0) as revenue,
      COALESCE(COUNT(DISTINCT bi.booking_id), 0) as bookings
    FROM date_series ds
    LEFT JOIN payments pay ON pay.paid_at >= ds.period_start 
      AND pay.paid_at < ds.period_start + $4::interval
      AND pay.status = 'COMPLETED'
    LEFT JOIN booking_items bi ON pay.booking_id = bi.booking_id
    LEFT JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    LEFT JOIN products p ON tt.product_id = p.id
    WHERE (p.game_id = $1 OR p.game_id IS NULL)
    GROUP BY ds.period_start
    ORDER BY ds.period_start ASC
  `;
    const res = await query(sql, [gameId, startDate, endDate, fullInterval]);
    return res.rows || [];
  },

  async getTicketPerformance(gameId, { startDate, endDate }) {
    const sql = `
    SELECT 
      tt.id,
      tt.category,
      tt.price,
      SUM(bi.quantity) as "ticketSold",
      SUM(bi.subtotal) as revenue
    FROM ticket_types tt
    JOIN products p ON tt.product_id = p.id
    LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
    LEFT JOIN payments pay ON bi.booking_id = pay.booking_id
    WHERE p.game_id = $1
      AND (pay.status = 'COMPLETED' OR pay.status IS NULL)
      AND (pay.paid_at BETWEEN $2 AND $3 OR pay.paid_at IS NULL)
    GROUP BY tt.id, tt.category, tt.price
    ORDER BY revenue DESC
  `;
    const res = await query(sql, [gameId, startDate, endDate]);
    return res.rows || [];
  },
};
module.exports = { Game, GameStats };
