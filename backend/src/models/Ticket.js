const { query } = require('../config/db');

const Ticket = {
  /**
   * Find ticket by ID
   */
  async findById(id) {
    const sql = `
      SELECT t.*,
             b.booking_reference, b.booking_status,
             e.name AS event_name, e.event_date, e.start_time, e.end_time,
             tt.name AS ticket_type_name, tt.category
      FROM tickets t
      JOIN bookings b ON t.booking_id = b.id
      JOIN events e ON b.event_id = e.id
      JOIN booking_items bi ON t.booking_item_id = bi.id
      JOIN ticket_types tt ON bi.ticket_type_id = tt.id
      WHERE t.id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find ticket by ticket code
   */
  async findByCode(ticketCode) {
    const sql = `
      SELECT t.*,
             b.booking_reference, b.booking_status, b.user_id,
             e.name AS event_name, e.event_date, e.start_time, e.end_time,
             tt.name AS ticket_type_name, tt.category
      FROM tickets t
      JOIN bookings b ON t.booking_id = b.id
      JOIN events e ON b.event_id = e.id
      JOIN booking_items bi ON t.booking_item_id = bi.id
      JOIN ticket_types tt ON bi.ticket_type_id = tt.id
      WHERE t.ticket_code = $1`;
    const result = await query(sql, [ticketCode]);
    return result.rows[0] || null;
  },

  /**
   * Find all tickets for a booking
   */
  async findByBookingId(bookingId) {
    const sql = `
      SELECT t.*,
             tt.name AS ticket_type_name, tt.category
      FROM tickets t
      JOIN booking_items bi ON t.booking_item_id = bi.id
      JOIN ticket_types tt ON bi.ticket_type_id = tt.id
      WHERE t.booking_id = $1
      ORDER BY t.created_at`;
    const result = await query(sql, [bookingId]);
    return result.rows;
  },

  /**
   * Find all game tickets for a user (tickets not associated with bookings)
   */
  async findByUserId(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT t.*,
             g.id AS game_id, g.name AS game_name, g.description AS game_description, g.rules,
             tg.status AS ticket_game_status, tg.used_at AS game_used_at,
             tt.name AS ticket_type_name, tt.category, tt.price as ticket_price
      FROM tickets t
      JOIN ticket_games tg ON t.id = tg.ticket_id
      JOIN games g ON tg.game_id = g.id
      LEFT JOIN ticket_types tt ON g.id = tt.game_id AND tt.is_active = true
      WHERE t.buyer_contact = (SELECT email FROM users WHERE id = $1)
        AND t.booking_id IS NULL
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3`;
    const result = await query(sql, [userId, limit, offset]);

    const countSql = `
      SELECT COUNT(*) 
      FROM tickets t
      JOIN ticket_games tg ON t.id = tg.ticket_id
      WHERE t.buyer_contact = (SELECT email FROM users WHERE id = $1)
        AND t.booking_id IS NULL`;
    const countResult = await query(countSql, [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    // Group tickets by game and format response
    const gamesMap = new Map();
    
    result.rows.forEach(row => {
      const gameKey = row.game_id;
      
      if (!gamesMap.has(gameKey)) {
        gamesMap.set(gameKey, {
          id: `game-${gameKey}`, // Composite ID for the group
          game_id: row.game_id,
          game_name: row.game_name,
          game_description: row.game_description,
          game_rules: row.rules,
          total_price: 0, // Will be calculated
          status: row.status,
          ticket_game_status: row.ticket_game_status,
          purchased_at: row.purchased_at,
          expires_at: row.expires_at,
          payment_reference: row.payment_reference,
          quantity: 0, // Will be calculated
          type: 'GAME_CONSOLIDATED',
          ticket_type_name: row.ticket_type_name,
          ticket_type_category: row.category,
          ticket_price: parseFloat(row.ticket_price) || parseFloat(row.total_price),
          ticket_codes: [], // Will collect all ticket codes
          game_used_at: row.game_used_at
        });
      }
      
      const gameGroup = gamesMap.get(gameKey);
      gameGroup.quantity += 1;
      gameGroup.total_price += parseFloat(row.total_price);
      gameGroup.ticket_codes.push(row.ticket_code);
    });

    return {
      tickets: Array.from(gamesMap.values()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all individual tickets for a specific game and user
   */
  async findByGameId(userId, gameId) {
    const sql = `
      SELECT t.*,
             g.id AS game_id, g.name AS game_name, g.description AS game_description, g.rules,
             tg.status AS ticket_game_status, tg.used_at AS game_used_at,
             tt.name AS ticket_type_name, tt.category, tt.price as ticket_price
      FROM tickets t
      JOIN ticket_games tg ON t.id = tg.ticket_id
      JOIN games g ON tg.game_id = g.id
      LEFT JOIN ticket_types tt ON g.id = tt.game_id AND tt.is_active = true
      WHERE t.buyer_contact = (SELECT email FROM users WHERE id = $1)
        AND t.booking_id IS NULL
        AND g.id = $2
      ORDER BY t.created_at DESC`;
    
    const result = await query(sql, [userId, gameId]);
    
    const tickets = result.rows.map(row => ({
      id: row.id,
      ticket_code: row.ticket_code,
      qr_token: row.qr_token,
      status: row.status,
      ticket_game_status: row.ticket_game_status,
      purchased_at: row.purchased_at,
      expires_at: row.expires_at,
      total_price: parseFloat(row.total_price),
      used_at: row.game_used_at,
      game: {
        id: row.game_id,
        name: row.game_name,
        description: row.game_description,
        rules: row.rules
      },
      ticket_type: {
        name: row.ticket_type_name,
        category: row.category,
        price: parseFloat(row.ticket_price) || parseFloat(row.total_price)
      }
    }));

    return tickets;
  },

  /**
   * Validate (use) a ticket at park entry
   */
  async validate(ticketCode) {
    // First check if ticket exists and is valid
    const checkSql = `
      SELECT t.*, b.booking_status, e.event_date
      FROM tickets t
      JOIN bookings b ON t.booking_id = b.id
      JOIN events e ON b.event_id = e.id
      WHERE t.ticket_code = $1`;
    const checkResult = await query(checkSql, [ticketCode]);
    const ticket = checkResult.rows[0];

    if (!ticket) {
      return { valid: false, reason: 'Ticket not found' };
    }
    if (ticket.booking_status !== 'confirmed') {
      return { valid: false, reason: 'Booking is not confirmed (status: ' + ticket.booking_status + ')' };
    }
    if (ticket.is_used) {
      return { valid: false, reason: 'Ticket has already been used', usedAt: ticket.used_at };
    }

    // Mark ticket as used
    const updateSql = `
      UPDATE tickets SET is_used = true, used_at = NOW()
      WHERE ticket_code = $1
      RETURNING *`;
    const updateResult = await query(updateSql, [ticketCode]);

    return { valid: true, ticket: updateResult.rows[0] };
  },
};

module.exports = Ticket;
