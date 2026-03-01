require("dotenv").config();
const bcrypt = require("bcrypt");
const { pool } = require("../config/db");

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log("Seeding database with Product Catalog model...");
    await client.query("BEGIN");

    // 1. Create Users
    const adminPassword = await bcrypt.hash("admin123", 12);
    const adminRes = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING RETURNING id`,
      ["Bora", "Admin", "admin@borapark.com", adminPassword, "ADMIN"],
    );
    const adminId = adminRes.rows[0]?.id;

    const visitorPassword = await bcrypt.hash("visitor123", 12);
    await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING`,
      ["John", "Doe", "visitor@example.com", visitorPassword, "VISITOR"],
    );

    // 2. Create Physical Event
    const eventRes = await client.query(
      `INSERT INTO events (name, event_date, start_time, end_time, capacity)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ["Grand Opening Concert", "2026-05-01", "18:00", "22:00", 1000],
    );
    const concertId = eventRes.rows[0].id;

    // 3. Create Physical Games
    const rollerRes = await client.query(
      `INSERT INTO games (name, rules, status) VALUES ($1, $2, $3) RETURNING id`,
      ["Thunder Coaster", "Must be 120cm tall. No heart conditions.", "OPEN"],
    );
    const bumperRes = await client.query(
      `INSERT INTO games (name, rules, status) VALUES ($1, $2, $3) RETURNING id`,
      ["Bumper Cars", "No aggressive head-on collisions.", "OPEN"],
    );

    // 4. Create PRODUCTS (The Commercial Wrapper)
    // Concert Product
    const prodEventRes = await client.query(
      `INSERT INTO products (name, product_type, event_id, valid_days)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ["Grand Opening Concert Pass", "EVENT", concertId, 1],
    );

    // Roller Coaster Product
    const prodRollerRes = await client.query(
      `INSERT INTO products (name, product_type, game_id, valid_days)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ["Thunder Coaster Ride", "GAME", rollerRes.rows[0].id, 30],
    );

    // Bumper Cars Product
    const prodBumperRes = await client.query(
      `INSERT INTO products (name, product_type, game_id, valid_days)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ["Bumper Car Sessions", "GAME", bumperRes.rows[0].id, 30],
    );

    // 5. Create TICKET_TYPES (Pricing for the Products)
    const ticketData = [
      // Concert Pricing
      [prodEventRes.rows[0].id, "ADULT", 500.0],
      [prodEventRes.rows[0].id, "STUDENT", 350.0],

      // Roller Coaster Pricing
      [prodRollerRes.rows[0].id, "ADULT", 150.0],
      [prodRollerRes.rows[0].id, "CHILD", 100.0],

      // Bumper Car Pricing
      [prodBumperRes.rows[0].id, "ADULT", 80.0],
      [prodBumperRes.rows[0].id, "CHILD", 60.0],
    ];

    for (const [prodId, cat, price] of ticketData) {
      await client.query(
        `INSERT INTO ticket_types (product_id, category, price)
         VALUES ($1, $2, $3)`,
        [prodId, cat, price],
      );
    }

    await client.query("COMMIT");
    console.log("--- SEEDING COMPLETE ---");
    console.log("Admin: admin@borapark.com / admin123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
