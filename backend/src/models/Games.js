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
      // ticket_types is an array of objects: [{ category, price, name, is_active }, ...]
      if (ticket_types && ticket_types.length > 0) {
        // Build a single INSERT statement with multiple rows to avoid
        // sequential round-trips. We prepare placeholders and a flattened
        // values array that repeats newGame.id for each ticket type.
        let ttSql = `INSERT INTO ticket_types (game_id, name, category, price, is_active) VALUES `;
        const ttValues = [];
        let placeholderIdx = 1;

        ticket_types.forEach((tt) => {
          ttSql += `($${placeholderIdx++}, $${placeholderIdx++}, $${placeholderIdx++}, $${placeholderIdx++}, $${placeholderIdx++}),`;
          ttValues.push(
            newGame.id,
            tt.name,
            tt.category,
            tt.price,
            tt.is_active,
          );
        });

        // remove trailing comma
        ttSql = ttSql.slice(0, -1);

        await client.query(ttSql, ttValues);
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

  async deleteById(id) {
    const sql = `
      DELETE FROM games WHERE id=$1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result;
  },

  async getById(id) {
    const sql = `
    SELECT g.*, 
    COALESCE(
        JSON_AGG(tt.*) FILTER (WHERE tt.id IS NOT NULL), 
        '[]'
    ) AS ticket_types
    FROM games g
    LEFT JOIN ticket_types tt ON g.id = tt.game_id
    WHERE g.id = $1
    GROUP BY g.id;
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  },
};
module.exports = Games;
