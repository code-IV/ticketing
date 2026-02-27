const { query, getClient } = require("../config/db");
const {
  generateBookingReference,
  generateTicketCode,
  generateQRData,
} = require("../utils/helpers");

const Booking = {
  /**
   * Create a full booking with items and tickets (transactional) for an Event
   * items: [{ ticketTypeId, quantity, unitPrice }]
   */
  async bookEvent({
    userId,
    eventId,
    items,
    paymentMethod,
    guestEmail,
    guestName,
    notes,
    expires_at,
  }) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // Calculate total
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unitPrice;
      }

      // Calculate total ticket quantity
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

      // Check event availability
      const availCheck = await client.query(
        `SELECT capacity, tickets_sold, (capacity - tickets_sold) AS available
         FROM events WHERE id = $1 AND is_active = true FOR UPDATE`,
        [eventId],
      );

      if (!availCheck.rows[0]) {
        throw new Error("Event not found or is inactive");
      }

      const available = parseInt(availCheck.rows[0].available, 10);
      if (available < totalQuantity) {
        throw new Error(`Only ${available} tickets remaining for this event`);
      }

      // Generate booking reference
      const bookingReference = generateBookingReference();

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (booking_reference, user_id, event_id, total_amount, booking_status, payment_status, payment_method, guest_email, guest_name, notes)
         VALUES ($1, $2, $3, $4, 'confirmed', 'completed', $5, $6, $7, $8)
         RETURNING *`,
        [
          bookingReference,
          userId,
          eventId,
          totalAmount,
          paymentMethod,
          guestEmail,
          guestName,
          notes,
        ],
      );
      const booking = bookingResult.rows[0];

      // Get event date for QR
      const eventResult = await client.query(
        `SELECT event_date FROM events WHERE id = $1`,
        [eventId],
      );
      const eventDate = eventResult.rows[0].event_date;

      // Create booking items and individual tickets
      const createdItems = [];
      const createdTickets = [];

      for (const item of items) {
        const subtotal = item.quantity * item.unitPrice;

        const itemResult = await client.query(
          `INSERT INTO booking_items (booking_id, ticket_type_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            booking.id,
            item.ticketTypeId,
            item.quantity,
            item.unitPrice,
            subtotal,
          ],
        );
        const bookingItem = itemResult.rows[0];
        createdItems.push(bookingItem);

        // Create individual tickets for each quantity
        for (let i = 0; i < item.quantity; i++) {
          const ticketCode = generateTicketCode();
          const qrData = generateQRData(
            ticketCode,
            bookingReference,
            eventDate,
          );

          const ticketResult = await client.query(
            `INSERT INTO tickets (booking_id, booking_item_id, ticket_code, qr_token, expires_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [booking.id, bookingItem.id, ticketCode, qrData, expires_at],
          );
          createdTickets.push(ticketResult.rows[0]);
        }
      }

      // Create payment record
      await client.query(
        `INSERT INTO payments (booking_id, amount, payment_method, payment_status, paid_at)
         VALUES ($1, $2, $3, 'completed', NOW())`,
        [booking.id, totalAmount, paymentMethod],
      );

      // Update event tickets_sold
      await client.query(
        `UPDATE events SET tickets_sold = tickets_sold + $2 WHERE id = $1`,
        [eventId, totalQuantity],
      );

      await client.query("COMMIT");

      return {
        ...booking,
        items: createdItems,
        tickets: createdTickets,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
  /**
   * Create a full booking with items and tickets (transactional) for Games
   * items: [{ ticketTypeId, quantity, unitPrice }]
   */
  async bookGames({
    items,
    totalAmount,
    paymentMethod,
    guestEmail,
    guestName,
    notes,
    expires_at, // e.g. 3 days
  }) {
    const client = await getClient();

    try {
      await client.query("BEGIN");

      // 2️⃣ Create booking
      const bookingReference = generateBookingReference();

      const bookingResult = await client.query(
        `INSERT INTO bookings
       (booking_reference, total_amount, booking_status, payment_status, payment_method, guest_email, guest_name, notes)
       VALUES ($1, $2, 'confirmed', 'completed', $3, $4, $5, $6)
       RETURNING *`,
        [
          bookingReference,
          totalAmount,
          paymentMethod,
          guestEmail,
          guestName,
          notes,
        ],
      );

      const booking = bookingResult.rows[0];

      // 3️⃣ Insert booking_items
      const createdItems = [];

      for (const item of items) {
        const typeResult = await client.query(
          `SELECT price, game_id
         FROM ticket_types
         WHERE id = $1`,
          [item.ticketTypeId],
        );

        const { price, game_id } = typeResult.rows[0];
        const subtotal = price * item.quantity;

        const itemResult = await client.query(
          `INSERT INTO booking_items
         (booking_id, ticket_type_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
          [booking.id, item.ticketTypeId, item.quantity, price, subtotal],
        );

        createdItems.push({
          ...itemResult.rows[0],
          game_id,
        });
      }

      // 4️⃣ Create ONE ticket container
      const ticketCode = generateTicketCode();
      const qrToken = generateQRData();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate());

      const ticketResult = await client.query(
        `INSERT INTO tickets
       (booking_id, ticket_code, qr_token,
        status, total_price, expires_at)
       VALUES ($1, $2, $3,
               'ACTIVE', $4, $5)
       RETURNING *`,
        [booking.id, ticketCode, qrToken, totalAmount, expiresAt],
      );

      const ticket = ticketResult.rows[0];

      // 5️⃣ Expand booking_items into ticket_games
      for (const item of createdItems) {
        for (let i = 0; i < item.quantity; i++) {
          await client.query(
            `INSERT INTO ticket_games
           (ticket_id, game_id, status)
           VALUES ($1, $2, 'AVAILABLE')`,
            [ticket.id, item.game_id],
          );
        }
      }

      // 6️⃣ Create payment record
      await client.query(
        `INSERT INTO payments
       (booking_id, amount, payment_method,
        payment_status, paid_at)
       VALUES ($1, $2, $3,
               'completed', NOW())`,
        [booking.id, totalAmount, paymentMethod],
      );

      await client.query("COMMIT");

      return {
        ...booking,
        items: createdItems,
        ticket,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Find booking by ID
   */
  async findById(id) {
    const sql = `
      SELECT b.*,
             e.name AS event_name, e.event_date, e.start_time, e.end_time
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find booking by reference
   */
  async findByReference(reference) {
    const sql = `
      SELECT b.*,
             e.name AS event_name, e.event_date, e.start_time, e.end_time
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.booking_reference = $1`;
    const result = await query(sql, [reference]);
    return result.rows[0] || null;
  },

  /**
   * Find booking by ID with full details (items + tickets)
   */
  async findByIdWithDetails(id) {
    const bookingSql = `
      SELECT b.*,
             e.name AS event_name, e.event_date, e.start_time, e.end_time,
             u.first_name, u.last_name, u.email AS user_email
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1`;
    const bookingResult = await query(bookingSql, [id]);
    const booking = bookingResult.rows[0];
    if (!booking) return null;

    const itemsSql = `
      SELECT bi.*, tt.name AS ticket_type_name, tt.category
      FROM booking_items bi
      JOIN ticket_types tt ON bi.ticket_type_id = tt.id
      WHERE bi.booking_id = $1`;
    const itemsResult = await query(itemsSql, [id]);

    const ticketsSql = `
      SELECT * FROM tickets WHERE booking_id = $1 ORDER BY created_at`;
    const ticketsResult = await query(ticketsSql, [id]);

    return {
      ...booking,
      items: itemsResult.rows,
      tickets: ticketsResult.rows,
    };
  },

  /**
   * Get bookings for a user
   */
  async findByUserId(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT b.*,
             e.name AS event_name, e.event_date, e.start_time, e.end_time
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3`;
    const result = await query(sql, [userId, limit, offset]);

    const countSql = `SELECT COUNT(*) FROM bookings WHERE user_id = $1`;
    const countResult = await query(countSql, [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      bookings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all bookings (admin)
   */
  async findAll({ page = 1, limit = 20, status = null }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT b.*,
             e.name AS event_name, e.event_date,
             u.first_name || ' ' || u.last_name AS customer_name, u.email AS customer_email
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN users u ON b.user_id = u.id`;
    const values = [];
    let paramIndex = 1;

    if (status) {
      sql += ` WHERE b.booking_status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);

    let countSql = `SELECT COUNT(*) FROM bookings`;
    const countValues = [];
    if (status) {
      countSql += ` WHERE booking_status = $1`;
      countValues.push(status);
    }
    const countResult = await query(countSql, countValues);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      bookings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Cancel a booking (transactional)
   */
  async cancel(id) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // Get booking details
      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE id = $1 AND booking_status = 'confirmed' FOR UPDATE`,
        [id],
      );
      const booking = bookingResult.rows[0];
      if (!booking) {
        throw new Error("Booking not found or already cancelled");
      }

      // Get total tickets in this booking
      const itemsResult = await client.query(
        `SELECT SUM(quantity) AS total_qty FROM booking_items WHERE booking_id = $1`,
        [id],
      );
      const totalQty = parseInt(itemsResult.rows[0].total_qty, 10);

      // Update booking status
      await client.query(
        `UPDATE bookings SET booking_status = 'cancelled', payment_status = 'refunded', cancelled_at = NOW()
         WHERE id = $1`,
        [id],
      );

      // Update payment status
      await client.query(
        `UPDATE payments SET payment_status = 'refunded' WHERE booking_id = $1`,
        [id],
      );

      // Restore event capacity
      await client.query(
        `UPDATE events SET tickets_sold = GREATEST(tickets_sold - $2, 0) WHERE id = $1`,
        [booking.event_id, totalQty],
      );

      await client.query("COMMIT");

      return { success: true, bookingId: id };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = Booking;
