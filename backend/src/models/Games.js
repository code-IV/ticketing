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
            INSERT INTO ticket_types (game_id, name, category, price, description)
            VALUES ($1, $2, $3, $4, $5)
          `;
            await client.query(ttSql, [
              id,
              tt.name,
              tt.category,
              tt.price,
              tt.description,
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

  async deleteById(id) {
    const sql = `
      DELETE FROM games WHERE id=$1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result;
  },
};
module.exports = Games;
