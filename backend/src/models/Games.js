const { query, getClient } = require("../config/db");

const Games = {
  async create({ name, description, rules, status, ticket_types }) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      // 1. Insert the Game
      const gameSql = `
      INSERT INTO games (name, description, rules, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
  `;
      const gameValues = [name, description, rules, status];
      const gameResult = await client.query(gameSql, gameValues);
      const newGame = gameResult.rows[0];

      // 2. Insert the specific ticket categories provided for THIS game
      // ticket_types is an array of objects: [{ category, price, name }, ...]
      if (ticket_types && ticket_types.length > 0) {
        for (const tt of ticket_types) {
          const ttSql = `
        INSERT INTO ticket_types (game_id, name, category, price, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `;
          // Use the specific price sent from the UI for this category
          const ttValues = [
            newGame.id,
            tt.name,
            tt.category,
            tt.price,
            tt.is_active,
          ];
          await client.query(ttSql, ttValues);
        }
      }

      await client.query("COMMIT");
      return { ...newGame, ticket_types_count: ticket_types?.length ?? 0 };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getAll() {
    const sql = `
      SELECT 
      g.*,
      COALESCE(
        JSON_AGG(tt.*) FILTER (WHERE tt.id IS NOT NULL), 
        '[]'
      ) AS ticket_types
    FROM games g
    LEFT JOIN ticket_types tt ON g.id = tt.game_id
    GROUP BY g.id
    ORDER BY g.created_at DESC`;
    const result = await query(sql);
    return result.rows;
  },
};
module.exports = Games;
