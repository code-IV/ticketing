const { query, getClient } = require("../../config/db");

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
      SELECT g.id, g.name, g.description, g.rules, g.status,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', tt.id,
            'category', tt.category,
            'price', tt.price
          )
        ) FILTER (WHERE tt.id IS NOT NULL), 
        '[]'
      ) AS ticket_types
    FROM games g
    -- 1. Link Game to its Product wrapper
    LEFT JOIN products p ON g.id = p.game_id
    -- 2. Link Product to its various Price points
    LEFT JOIN ticket_types tt ON p.id = tt.product_id
    GROUP BY g.id
    ORDER BY g.created_at DESC;`;
    const result = await query(sql);
    return result.rows;
  },

  async findById(id) {
    const sql = `
    SELECT 
      g.*, 
      COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', tt.id,
              'product_id', tt.product_id,
              'category', tt.category,
              'price', tt.price,
              'created_at', tt.created_at
            )
          ) FILTER (WHERE tt.id IS NOT NULL), 
          '[]'
      ) AS ticket_types
    FROM games g
    -- Hop through products to get to ticket_types
    LEFT JOIN products p ON g.id = p.game_id
    LEFT JOIN ticket_types tt ON p.id = tt.product_id
    WHERE g.id = $1
    GROUP BY g.id;
  `;
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  async deleteGame(id) {
    const sql = `
    DELETE FROM games 
    WHERE id = $1
    RETURNING *;
  `;
    const result = await query(sql, [id]);
    // result.rows[0] contains the deleted game data
    return result.rows[0];
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
