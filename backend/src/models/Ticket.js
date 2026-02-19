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
