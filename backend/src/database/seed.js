require("dotenv").config();
const bcrypt = require("bcrypt");
const { pool } = require("../config/db");

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log("Seeding database with expanded Product Catalog...");
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

    // 2. Define 8 Events
    const eventsData = [
      ["Grand Opening Concert", "2026-05-01", "18:00", "22:00", 1000],
      ["Summer Splash Party", "2026-06-15", "10:00", "20:00", 500],
      ["Night of Magic Show", "2026-05-10", "19:30", "21:00", 200],
      ["Tech Expo 2026", "2026-07-20", "09:00", "17:00", 2000],
      ["Weekend Food Festival", "2026-05-22", "11:00", "23:00", 1500],
      ["Kids Puppet Theater", "2026-05-05", "14:00", "15:30", 100],
      ["Extreme Stunt Show", "2026-08-12", "16:00", "18:00", 800],
      ["New Year Eve Gala", "2026-12-31", "20:00", "02:00", 1200],
    ];

    const eventProductIds = [];
    for (const [name, date, start, end, cap] of eventsData) {
      const eRes = await client.query(
        `INSERT INTO events (name, event_date, start_time, end_time, capacity)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [name, date, start, end, cap],
      );
      const pRes = await client.query(
        `INSERT INTO products (name, product_type, event_id, valid_days)
         VALUES ($1, 'EVENT', $2, 1) RETURNING id`,
        [`${name} Pass`, eRes.rows[0].id],
      );
      eventProductIds.push(pRes.rows[0].id);
    }

    // 3. Define 20 Games
    const gamesData = [
      ["Thunder Coaster", "Must be 120cm tall.", "OPEN"],
      ["Bumper Cars", "No head-on collisions.", "OPEN"],
      ["Scary Hall", "Not for the faint of heart.", "OPEN"],
      ["Ferris Wheel", "Enjoy the view.", "OPEN"],
      ["Spinning Teacups", "Don't get dizzy!", "OPEN"],
      ["Water Log Flume", "You will get wet.", "OPEN"],
      ["Mirror Maze", "Find your way out.", "OPEN"],
      ["Carousel", "Classic fun for kids.", "OPEN"],
      ["Free Fall Tower", "70 meters of terror.", "OPEN"],
      ["Go-Kart Racing", "Must have a valid height.", "OPEN"],
      ["Pirate Ship", "Swing high and low.", "ON_MAINTENANCE"],
      ["Virtual Reality Hub", "Experience the digital world.", "OPEN"],
      ["Archery Range", "Focus and hit the target.", "OPEN"],
      ["Laser Tag Arena", "Team up and win.", "OPEN"],
      ["Mini Golf Course", "18 holes of fun.", "OPEN"],
      ["Space Shuttle Sim", "Feel the G-force.", "OPEN"],
      ["Jungle Safari Train", "Watch the animatronics.", "OPEN"],
      ["Mechanical Bull", "Hold on tight!", "OPEN"],
      ["Trampoline Park", "Bounce to the sky.", "OPEN"],
      ["Climbing Wall", "Safety harness required.", "OPEN"],
    ];

    const gameProductIds = [];
    for (const [name, rules, status] of gamesData) {
      const gRes = await client.query(
        `INSERT INTO games (name, rules, status) VALUES ($1, $2, $3) RETURNING id`,
        [name, rules, status],
      );
      const pRes = await client.query(
        `INSERT INTO products (name, product_type, game_id, valid_days)
         VALUES ($1, 'GAME', $2, 30) RETURNING id`,
        [`${name} Ticket`, gRes.rows[0].id],
      );
      gameProductIds.push(pRes.rows[0].id);
    }

    // 4. Create TICKET_TYPES (Pricing)
    // Bulk pricing for Event Products
    for (const prodId of eventProductIds) {
      await client.query(
        `INSERT INTO ticket_types (product_id, category, price) VALUES 
         ($1, 'ADULT', 600.0), ($1, 'STUDENT', 400.0)`,
        [prodId],
      );
    }

    // Bulk pricing for Game Products
    for (const prodId of gameProductIds) {
      await client.query(
        `INSERT INTO ticket_types (product_id, category, price) VALUES 
         ($1, 'ADULT', 150.0), ($1, 'CHILD', 100.0)`,
        [prodId],
      );
    }

    await client.query("COMMIT");
    console.log("--- SEEDING COMPLETE ---");
    console.log(
      `Created: ${eventsData.length} Events and ${gamesData.length} Games.`,
    );

    // 5. Add Random Users
    console.log("Adding random users...");
    try {
      process.env.CALLED_FROM_SEED = 'true';
      const { addRandomUsers } = require("./addRandomUsers.js");
      await addRandomUsers(client);
    } catch (error) {
      console.error("Failed to add random users:", error.message);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
