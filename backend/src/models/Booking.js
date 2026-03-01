const { query, getClient } = require("../config/db");
const {
  generateBookingReference,
  generateTicketCode,
  generateQRToken,
} = require("../utils/helpers");

const Booking = {
  /**
   * Create a full booking with items and tickets (transactional) for an Event
   * items: [{ ticketTypeId, quantity, unitPrice }]
   */
  async bookEvent({
    userId,
    items, // Array of { ticketTypeId, quantity, unitPrice, productId }
    paymentMethod,
    guestEmail,
    guestName,
    expires_at,
  }) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // 1. Calculate Totals
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const bookingReference = generateBookingReference();

      // 2. Create Booking (Order Header)
      // Removed event_id as the product catalog handles the relationship
      const bookingResult = await client.query(
        `INSERT INTO bookings (booking_reference, user_id, total_amount, status, guest_email, guest_name)
       VALUES ($1, $2, $3, 'CONFIRMED', $4, $5)
       RETURNING *`,
        [bookingReference, userId, totalAmount, guestEmail, guestName],
      );
      const booking = bookingResult.rows[0];

      // 3. Create Master Ticket (The only QR the user needs)
      const ticketCode = generateTicketCode();
      const qrToken = generateQRToken(ticketCode, bookingReference, expires_at);

      const ticketResult = await client.query(
        `INSERT INTO tickets (booking_id, ticket_code, qr_token, status, expires_at)
       VALUES ($1, $2, $3, 'ACTIVE', $4)
       RETURNING *`,
        [booking.id, ticketCode, qrToken, expires_at],
      );
      const masterTicket = ticketResult.rows[0];

      // 4. Process Items & Entitlements
      for (const item of items) {
        const subtotal = item.quantity * item.unitPrice;

        // Save the line item record
        await client.query(
          `INSERT INTO booking_items (booking_id, ticket_type_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
          [
            booking.id,
            item.ticketTypeId,
            item.quantity,
            item.unitPrice,
            subtotal,
          ],
        );

        // Link the Product to the Master Ticket with the purchased quantity
        // This is your "Digital Punch Card"
        await client.query(
          `INSERT INTO ticket_products (ticket_id, product_id, total_quantity, status)
         VALUES ($1, (SELECT product_id FROM ticket_types WHERE id = $2), $3, 'AVAILABLE')`,
          [masterTicket.id, item.ticketTypeId, item.quantity],
        );

        // If this is an Event, update the capacity
        await client.query(
          `UPDATE events SET tickets_sold = tickets_sold + $1 
         WHERE id = (SELECT event_id FROM products p JOIN ticket_types tt ON tt.product_id = p.id WHERE tt.id = $2)`,
          [item.quantity, item.ticketTypeId],
        );
      }

      // 5. Record Payment
      await client.query(
        `INSERT INTO payments (booking_id, amount, method, status, paid_at)
       VALUES ($1, $2, $3, 'COMPLETED', NOW())`,
        [booking.id, totalAmount, paymentMethod.toUpperCase()],
      );

      await client.query("COMMIT");

      return {
        ...booking,
        ticket: masterTicket,
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
    userId,
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
       (user_id, booking_reference, total_amount, status, guest_email, guest_name)
       VALUES ($1, $2, $3, 'CONFIRMED', $4, $5)
       RETURNING *`,
        [userId, bookingReference, totalAmount, guestEmail, guestName],
      );

      const booking = bookingResult.rows[0];

      // 3️⃣ Insert booking_items
      const createdItems = [];

      for (const item of items) {
        const typeResult = await client.query(
          `SELECT price, product_id
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
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate());
      // 4️⃣ Create ONE ticket container
      const ticketCode = generateTicketCode();
      const qrToken = generateQRToken(ticketCode, bookingReference, expiresAt);

      const ticketResult = await client.query(
        `INSERT INTO tickets
       (booking_id, ticket_code, qr_token,
        status, expires_at)
       VALUES ($1, $2, $3,
               'ACTIVE', $4)
       RETURNING *`,
        [booking.id, ticketCode, qrToken, expiresAt],
      );

      const ticket = ticketResult.rows[0];

      // 5️⃣ Expand booking_items into ticket_prodcts
      for (const item of createdItems) {
        await client.query(
          `INSERT INTO ticket_products
           (ticket_id, product_id, total_quantity, status)
           VALUES ($1, $2, $3, 'AVAILABLE')`,
          [ticket.id, item.game_id, item.quantity],
        );
      }

      // 6️⃣ Create payment record
      await client.query(
        `INSERT INTO payments
       (booking_id, amount, method,
        status, paid_at)
       VALUES ($1, $2, $3,
               'COMPLETED', NOW())`,
        [booking.id, totalAmount, paymentMethod.toUpperCase()],
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
      SELECT 
          b.*,
          -- Get Event details if they exist
          e.name AS event_name, 
          e.event_date, 
          e.start_time, 
          e.end_time,
          -- Get Game details if they exist
          g.name AS game_name,
          -- Determine the type for your Frontend Interface
          p.product_type AS type
      FROM bookings b
      JOIN booking_items bi ON b.id = bi.booking_id
      JOIN ticket_types tt ON bi.ticket_type_id = tt.id
      JOIN products p ON tt.product_id = p.id
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN games g ON p.game_id = g.id
      WHERE b.id = $1;
      `;
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
    // 1. Fetch Booking Header
    // We map 'status' to 'booking_status' to match your interface
    const bookingSql = `
    SELECT b.*, b.status AS booking_status, b.created_at as booked_at,
           u.first_name, u.last_name, u.email AS user_email
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.id = $1`;

    const bookingResult = await query(bookingSql, [id]);
    const booking = bookingResult.rows[0];
    if (!booking) return null;

    // 2. Fetch Items
    const itemsSql = `
    SELECT bi.*, 
           tt.category, 
           p.name AS product_name, p.product_type, p.event_id, p.game_id,
           e.event_date, e.start_time, e.end_time
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN products p ON tt.product_id = p.id
    LEFT JOIN events e ON p.event_id = e.id
    WHERE bi.booking_id = $1`;
    const itemsResult = await query(itemsSql, [id]);

    // 3. Fetch Master Ticket & Entitlements
    const ticketsSql = `
    SELECT t.*,
           (
             SELECT json_agg(ent) 
             FROM (
               SELECT tp.*, p_inner.name as activity_name 
               FROM ticket_products tp
               JOIN products p_inner ON tp.product_id = p_inner.id
               WHERE tp.ticket_id = t.id
             ) ent
           ) as entitlements
    FROM tickets t 
    WHERE t.booking_id = $1`;
    const ticketsResult = await query(ticketsSql, [id]);

    // 4. Fetch Latest Payment to fill top-level status
    const paymentsSql = `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`;
    const paymentsResult = await query(paymentsSql, [id]);
    const latestPayment = paymentsResult.rows[0];

    // 5. Transform for Frontend
    // If the booking contains an event, we pull it to the top level for backward compatibility
    const eventItem = itemsResult.rows.find((i) => i.product_type === "EVENT");

    return {
      ...booking,
      // Mapping for the interface
      payment_status: latestPayment?.status?.toLowerCase() || "pending",
      payment_method: latestPayment?.method?.toLowerCase() || null,

      // Top-level event info (if it exists in the order)
      event_id: eventItem?.event_id || null,
      event_name: eventItem?.product_name || null,
      event_date: eventItem?.event_date || null,
      start_time: eventItem?.start_time || null,
      end_time: eventItem?.end_time || null,

      items: itemsResult.rows,
      tickets: ticketsResult.rows.map((t) => ({
        ...t,
        // Ensure entitlements is never null for the UI
        entitlements: t.entitlements || [],
      })),
      payments: paymentsResult.rows,
    };
  },

  /**
   * Get bookings for a user
   */
  async findByUserId(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const sql = `
    SELECT 
  b.*,
  -- Determine the primary type based on the first product in the booking
  (
    SELECT p.product_type 
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN products p ON tt.product_id = p.id
    WHERE bi.booking_id = b.id
    LIMIT 1
  ) as type,
  -- Fetch all items for this booking as a JSON array
  (
    SELECT json_agg(item_details)
    FROM (
      SELECT 
        bi.*, 
        p.name as product_name,
        p.product_type,
        tt.category,
        e.event_date,
        e.start_time,
        g.name as game_name
      FROM booking_items bi
      JOIN ticket_types tt ON bi.ticket_type_id = tt.id
      JOIN products p ON tt.product_id = p.id
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN games g ON p.game_id = g.id
      WHERE bi.booking_id = b.id
    ) item_details
  ) as items
FROM bookings b
WHERE b.user_id = $1
ORDER BY b.created_at DESC
LIMIT $2 OFFSET $3;
  `;

    const result = await query(sql, [userId, limit, offset]);

    // Clean up the result for the frontend
    const bookings = result.rows.map((row) => ({
      ...row,
      // Ensure items is an empty array if null
      items: row.items || [],
    }));

    const countSql = `SELECT COUNT(*) FROM bookings WHERE user_id = $1`;
    const countResult = await query(countSql, [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      bookings,
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
