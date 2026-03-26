require("dotenv").config();
const bcrypt = require("bcrypt");
const { pool } = require("../config/db");

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log("Seeding database with a superUser...");
    await client.query("BEGIN");

    // 1. Create Users
    const adminPassword = await bcrypt.hash("admin123", 12);
    const roleId = await client.query(
      `SELECT id FROM roles WHERE name = 'SUPERADMIN'`,
    );

    if (!roleId.rows[0]) {
      throw new Error(
        "SUPERADMIN role not found. Ensure roles are seeded first.",
      );
    }

    const userId = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING RETURNING id`,
      ["Bora", "Admin", "admin@borapark.com", adminPassword, roleId.rows[0].id],
    );

    await client.query("COMMIT");
    console.log("--- SEEDING COMPLETE ---");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
