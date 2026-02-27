require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    await client.query('BEGIN');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminResult = await client.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Bora', 'Admin', 'admin@borapark.com', '+251911000000', adminPassword, 'admin']
    );

    const adminId = adminResult.rows[0]?.id;

    // Create a sample visitor
    const visitorPassword = await bcrypt.hash('visitor123', 12);
    await client.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['John', 'Doe', 'visitor@example.com', '+251922000000', visitorPassword, 'visitor']
    );

    if (adminId) {
      // Create sample events
      const event1 = await client.query(
        `INSERT INTO events (name, description, event_date, start_time, end_time, capacity, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          'Bora Park General Admission',
          'Full day access to all rides and attractions at Bora Amusement Park.',
          '2026-03-01',
          '09:00',
          '18:00',
          500,
          adminId,
        ]
      );

      const event2 = await client.query(
        `INSERT INTO events (name, description, event_date, start_time, end_time, capacity, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          'Weekend Special - Family Fun Day',
          'Special weekend event with extra shows and entertainment.',
          '2026-03-07',
          '10:00',
          '20:00',
          300,
          adminId,
        ]
      );

      // Create ticket types for event 1
      const ticketTypes1 = [
        ['Adult Ticket', 'adult', 250.00, 'Standard adult admission (ages 18+)'],
        ['Child Ticket', 'child', 150.00, 'Child admission (ages 3-17)'],
        ['Senior Ticket', 'senior', 180.00, 'Senior admission (ages 60+)'],
        ['Student Ticket', 'student', 200.00, 'Student admission with valid ID'],
      ];

      for (const [name, category, price, description] of ticketTypes1) {
        await client.query(
          `INSERT INTO ticket_types (event_id, name, category, price, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [event1.rows[0].id, name, category, price, description]
        );
      }

      // Create ticket types for event 2
      const ticketTypes2 = [
        ['Family Pack (2 Adults + 2 Kids)', 'group', 700.00, 'Discounted family bundle'],
        ['Adult Ticket', 'adult', 300.00, 'Weekend special adult admission'],
        ['Child Ticket', 'child', 180.00, 'Weekend special child admission'],
      ];

      for (const [name, category, price, description] of ticketTypes2) {
        await client.query(
          `INSERT INTO ticket_types (event_id, name, category, price, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [event2.rows[0].id, name, category, price, description]
        );
      }

      // Create sample games
      const game1 = await client.query(
        `INSERT INTO games (name, description, rules, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          'Roller Coaster Thrill',
          'Experience the ultimate adrenaline rush on our state-of-the-art roller coaster with multiple loops and drops.',
          'Must be 120cm or taller. No loose items allowed. Follow all safety instructions.',
          'OPEN'
        ]
      );

      const game2 = await client.query(
        `INSERT INTO games (name, description, rules, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          'Bumper Cars Arena',
          'Classic bumper car fun for all ages. Drive around and bump into friends and family safely.',
          'Maximum 2 people per car. Follow traffic signals. No aggressive bumping.',
          'OPEN'
        ]
      );

      const game3 = await client.query(
        `INSERT INTO games (name, description, rules, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          'Ferris Wheel View',
          'Get a breathtaking view of the entire park from our giant Ferris wheel.',
          'No food or drinks allowed. Secure all loose items. Remain seated at all times.',
          'OPEN'
        ]
      );

      // Create ticket types for games
      const gameTicketTypes = [
        // Game 1 - Roller Coaster
        [game1.rows[0].id, 'Single Ride', 'standard', 50.00, 'One ride on the roller coaster'],
        [game1.rows[0].id, 'Express Pass', 'premium', 100.00, 'Skip the line for roller coaster'],
        
        // Game 2 - Bumper Cars
        [game2.rows[0].id, '5 Minutes', 'standard', 30.00, '5 minutes of bumper car fun'],
        [game2.rows[0].id, '10 Minutes', 'standard', 50.00, '10 minutes of extended play'],
        
        // Game 3 - Ferris Wheel
        [game3.rows[0].id, 'Single Rotation', 'standard', 25.00, 'One complete rotation'],
        [game3.rows[0].id, 'Unlimited Rides', 'premium', 60.00, 'Unlimited rides for the day'],
      ];

      for (const [gameId, name, category, price, description] of gameTicketTypes) {
        await client.query(
          `INSERT INTO ticket_types (game_id, name, category, price, description, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [gameId, name, category, price, description]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully.');
    console.log('Admin login: admin@borapark.com / admin123');
    console.log('Visitor login: visitor@example.com / visitor123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
