const { query, getClient } = require("../../config/db");

const Games = {
  async create({ name, description, rules, status, ticket_types }) {
    const client = await getClient(); // Assuming pool.connect() for the client
    try {
      await client.query("BEGIN");

      // 1. Insert the Physical Game
      const gameSql = `
      INSERT INTO games (name, description, rules, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, status
    `;
      const gameResult = await client.query(gameSql, [
        name,
        description,
        rules,
        status || "OPEN",
      ]);
      const newGame = gameResult.rows[0];

      // 2. Create the Commercial Product wrapper
      // This makes the game "buyable" in the shop
      const productSql = `
      INSERT INTO products (name, product_type, game_id, is_active)
      VALUES ($1, 'GAME', $2, true)
      RETURNING id
    `;
      const productResult = await client.query(productSql, [
        newGame.name,
        newGame.id,
      ]);
      const productId = productResult.rows[0].id;

      // 3. Insert the Ticket Types (Prices) linked to the PRODUCT
      if (ticket_types && ticket_types.length > 0) {
        const ttValues = [];
        const placeholders = ticket_types
          .map((tt, i) => {
            const offset = i * 3; // product_id, category, price
            ttValues.push(productId, tt.category.toUpperCase(), tt.price);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
          })
          .join(",");

        const ttSql = `
        INSERT INTO ticket_types (product_id, category, price) 
        VALUES ${placeholders}
      `;

        await client.query(ttSql, ttValues);
      }

      await client.query("COMMIT");
      return {
        ...newGame,
        product_id: productId,
        ticket_types_count: ticket_types?.length ?? 0,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating game product:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id, { name, description, rules, status, ticket_types }) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
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
      const values = [id, name, description, rules, status];
      const game = await client.query(sql, values);

      if (ticket_types) {
        // First, wipe the old ones
        await client.query("DELETE FROM ticket_types WHERE game_id = $1", [id]);

        // Then, insert the new matrix
        if (ticket_types.length > 0) {
          for (const tt of ticket_types) {
            const ttSql = `
            INSERT INTO ticket_types (game_id, name, category, price, description, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;
            await client.query(ttSql, [
              id,
              tt.name,
              tt.category,
              tt.price,
              tt.description,
              tt.is_active !== undefined ? tt.is_active : true, // Default to true if not provided
            ]);
          }
        }
      }
      await client.query("COMMIT");
      return game.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Transaction Error:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getAll() {
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

  async getById(id) {
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

  async deleteById(id) {
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
module.exports = { Games, GameStats };
