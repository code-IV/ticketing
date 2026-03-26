const { getClient } = require("../../config/db");

const Product = {
  async deleteProduct(id) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      const productSql = `DELETE FROM products WHERE id = $1 RETURNING game_id, event_id`;
      const productRes = await client.query(productSql, [id]);

      if (productRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Product not found" };
      }

      const { game_id, event_id } = productRes.rows[0];

      if (game_id) {
        await client.query(`DELETE FROM games WHERE id = $1`, [game_id]);
      }

      if (event_id) {
        await client.query(`DELETE FROM events WHERE id = $1`, [event_id]);
      }

      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("Error deleting product:", err);
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = { Product };
