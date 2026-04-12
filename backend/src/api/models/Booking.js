const { query, getClient } = require("../../config/db");
const {
  generateBookingReference,
  generateTicketCode,
  generateQRToken,
} = require("../../utils/helpers");
const PromotionEngine = require("../../utils/promotinEngine");
const { Discount } = require("./Discount");

const Booking = {
  /**
   * Create a full booking with items and tickets (transactional) for an Event
   * items: [{ ticketTypeId, quantity, unitPrice }]
   */
  async createBooking(client, data) {
    const { reference, userId, total } = data;
    const sql = `
      INSERT INTO bookings (booking_reference, user_id, total_amount, status)
      VALUES ($1, $2, $3, 'CONFIRMED') RETURNING *`;
    return (await client.query(sql, [reference, userId, total])).rows[0];
  },

  async createMasterTicket(client, data) {
    const { bookingId, code, token, expiresAt } = data;
    const sql = `
      INSERT INTO tickets (booking_id, ticket_code, qr_token, status, expires_at)
      VALUES ($1, $2, $3, 'ACTIVE', $4) RETURNING *`;
    return (await client.query(sql, [bookingId, code, token, expiresAt]))
      .rows[0];
  },

  async addBookingItem(client, item) {
    const sql = `
      INSERT INTO booking_items (booking_id, ticket_type_id, promotion_id, quantity, unit_price, subtotal, discount_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    return client.query(sql, [
      item.bookingId,
      item.ticketTypeId,
      item.promotionId || null,
      item.quantity,
      item.finalPrice,
      item.subtotal,
      item.discountAmount,
    ]);
  },

  async createEntitlement(client, { ticketId, ticketTypeId, quantity }) {
    const sql = `
      INSERT INTO ticket_products (ticket_id, product_id, ticket_type_id, total_quantity, status)
      SELECT $1, product_id, $2, $3, 'AVAILABLE'
      FROM ticket_types WHERE id = $2;`;
    return client.query(sql, [ticketId, ticketTypeId, quantity]);
  },

  async updateEventCapacity(client, ticketTypeId, quantity) {
    const sql = `
      UPDATE events SET tickets_sold = tickets_sold + $1 
      WHERE id = (SELECT event_id FROM products p JOIN ticket_types tt ON tt.product_id = p.id WHERE tt.id = $2)`;
    return client.query(sql, [quantity, ticketTypeId]);
  },

  // 3️⃣ Record Payment
  async recordPayment(client, { bookingId, amount, method }) {
    return client.query(
      `INSERT INTO payments (booking_id, amount, method, status, paid_at)
       VALUES ($1, $2, $3, 'COMPLETED', NOW())`,
      [bookingId, amount, method],
    );
  },
  /**
   * Create a full booking with items and tickets (transactional) for Games
   * items: [{ ticketTypeId, quantity, unitPrice }]
   */
  async bookGames(
    { userId, items, paymentMethod, expires_in_days = 30 },
    user = null,
  ) {
    const client = await getClient();

    try {
      await client.query("BEGIN");

      const bookingReference = generateBookingReference();

      let totalAmount = 0;

      // 1️⃣ FIRST LOOP: compute prices, discounts, totals and enrich items
      const enrichedItems = [];

      for (const item of items) {
        const typeResult = await client.query(
          `SELECT tt.price, tt.category, p.id as product_id, p.name as product_name 
         FROM ticket_types tt
         JOIN products p ON tt.product_id = p.id
         WHERE tt.id = $1 AND tt.deleted_at IS NULL`,
          [item.ticketTypeId],
        );

        if (typeResult.rows.length === 0) {
          throw new Error(`Invalid Ticket Type ID: ${item.ticketTypeId}`);
        }

        const { price, category, product_id, product_name } =
          typeResult.rows[0];

        let discountAmount = 0;
        let finalPrice = price;

        if (item.promotionId) {
          const promo = await Discount.getById(item.promotionId);

          if (
            promo &&
            promo.rules?.length > 0 &&
            PromotionEngine.validateRules(promo.rules, {
              userId: user?.id,
              isAuthenticated: !!user,
              ticketTypeIds: [item.ticketTypeId],
              cartTotal: 0,
            })
          ) {
            const discount = PromotionEngine.calculateDiscount(
              price,
              promo.discount_type,
              promo.discount_value,
            );
            discountAmount = Math.min(discount, price);
            finalPrice = Math.max(0, price - discountAmount);
          }
        }

        const subtotal = finalPrice * item.quantity;
        totalAmount += subtotal;

        // Keep this for later loops
        enrichedItems.push({
          ...item,
          price,
          finalPrice,
          discountAmount,
          subtotal,
          product_id,
          product_name,
          category,
        });
      }

      // 2️⃣ Create booking header (now we have the correct totalAmount)
      const bookingResult = await client.query(
        `INSERT INTO bookings
       (user_id, booking_reference, total_amount, status)
       VALUES ($1, $2, $3, 'CONFIRMED')
       RETURNING *`,
        [userId, bookingReference, totalAmount],
      );
      const booking = bookingResult.rows[0];

      // 3️⃣ Create master ticket (needed for ticket_products)
      const ticketCode = generateTicketCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
      const qrToken = generateQRToken();

      const ticketResult = await client.query(
        `INSERT INTO tickets
       (booking_id, ticket_code, qr_token, status, expires_at)
       VALUES ($1, $2, $3, 'ACTIVE', $4)
       RETURNING id`,
        [booking.id, ticketCode, qrToken, expiresAt],
      );
      const ticketId = ticketResult.rows[0].id;

      const passesMap = {};

      // 4️⃣ SECOND LOOP: insert booking_items + ticket_products
      for (const item of enrichedItems) {
        // 4.1 Insert booking item
        await client.query(
          `INSERT INTO booking_items
         (booking_id, ticket_type_id, promotion_id, quantity, unit_price, subtotal, discount_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            booking.id,
            item.ticketTypeId,
            item.promotionId || null,
            item.quantity,
            item.finalPrice,
            item.subtotal,
            item.discountAmount,
          ],
        );

        // 4.2 Insert entitlement
        await client.query(
          `INSERT INTO ticket_products
         (ticket_id, product_id, ticket_type_id, total_quantity, status)
         VALUES ($1, $2, $3, $4, 'AVAILABLE')`,
          [ticketId, item.product_id, item.ticketTypeId, item.quantity],
        );

        // 4.3 Group for response
        if (!passesMap[item.product_name]) {
          passesMap[item.product_name] = {
            gameName: item.product_name,
            ticketTypes: [],
          };
        }

        passesMap[item.product_name].ticketTypes.push({
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.finalPrice,
          subtotal: item.subtotal,
          discountAmount: item.discountAmount,
          promotionId: item.promotionId || null,
        });
      }

      // 5️⃣ Record payment
      await client.query(
        `INSERT INTO payments
       (booking_id, amount, method, status, paid_at)
       VALUES ($1, $2, $3, 'COMPLETED', NOW())`,
        [booking.id, totalAmount, paymentMethod.toUpperCase()],
      );

      await client.query("COMMIT");

      return {
        bookingId: booking.id,
        reference: bookingReference,
        ticketCode,
        qrToken,
        passes: Object.values(passesMap),
      };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Booking Transaction Failed:", err);
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
      SELECT 
        b.id, b.booking_reference, b.user_id, b.total_amount, b.status, b.created_at, b.updated_at,
        u.first_name, u.last_name, u.email
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `;

    const bookingResult = await query(bookingSql, [id]);
    const booking = bookingResult.rows[0];
    if (!booking) return null;

    // 2. Fetch Items
    const itemsSql = `
    SELECT 
    p.name AS product_name, 
    p.product_type, 
    p.event_id, 
    p.game_id,
    e.event_date, 
    e.start_time, 
    e.end_time,
    json_agg(
        json_build_object(
            'id', bi.id,
            'ticketTypeId', bi.ticket_type_id,
            'quantity', bi.quantity,
            'unitPrice', bi.unit_price,
            'subtotal', bi.subtotal,
            'category', tt.category
        )
    ) AS ticket_types
FROM booking_items bi
JOIN ticket_types tt ON bi.ticket_type_id = tt.id
JOIN products p ON tt.product_id = p.id
LEFT JOIN events e ON p.event_id = e.id
WHERE bi.booking_id = $1
GROUP BY 
    p.id, p.name, p.product_type, p.event_id, p.game_id, 
    e.event_date, e.start_time, e.end_time;`;
    const itemsResult = await query(itemsSql, [id]);

    // 3. Fetch Master Ticket & Entitlements
    const ticketsSql = `
      SELECT t.*,
(
    SELECT json_agg(product_summary)
    FROM (
        SELECT 
            p.name as "productName",
            p.product_type as "productType",
            json_agg(
                json_build_object(
                    'id', tp.id,
                    'category', tt.category, -- Now a direct join!
                    'totalQuantity', tp.total_quantity,
                    'usedQuantity', tp.used_quantity,
                    'status', tp.status,
                    'lastUsedAt', tp.last_used_at
                )
            ) as "usageDetails"
        FROM ticket_products tp
        JOIN products p ON tp.product_id = p.id
        JOIN ticket_types tt ON tp.ticket_type_id = tt.id -- This is the magic simple join
        WHERE tp.ticket_id = t.id
        GROUP BY p.id, p.name, p.product_type
    ) product_summary
) as entitlements
FROM tickets t 
WHERE t.booking_id = $1;
`;
    const ticketsResult = await query(ticketsSql, [id]);

    // 4. Fetch Latest Payment to fill top-level status
    const paymentsSql = `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`;
    const paymentsResult = await query(paymentsSql, [id]);
    const latestPayment = paymentsResult.rows[0];

    return {
      ...booking,
      payment_status: latestPayment?.status || "PENDING",
      payment_method: latestPayment?.method || null,

      items: itemsResult.rows,
      tickets: ticketsResult.rows[0],
    };
  },

  /**
   * Get bookings for a user
   */
  async findByUserId(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const sql = `
    SELECT 
  b.id,
  b.booking_reference,
  b.total_amount,
  b.status,
  b.created_at,
  -- Determine the primary type (GAME or EVENT) for the UI badge
  (
    SELECT p.product_type 
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN products p ON tt.product_id = p.id
    WHERE bi.booking_id = b.id
    LIMIT 1
  ) as "type",
   (
    SELECT e.event_date
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN products p ON tt.product_id = p.id
    JOIN events e ON p.event_id = e.id
    WHERE bi.booking_id = b.id
    LIMIT 1
  ) as "eventDate",
  -- Build the Ticket and aggregated Passes object
  (
    SELECT json_build_object(
      'status', t.status,
      'expiresAt', t.expires_at,
      'passDetails', (
        SELECT json_agg("passDetails")
        FROM (
          SELECT 
            p.name as "productName",
            SUM(tp.total_quantity) as "totalQuantity",
            SUM(tp.used_quantity) as "usedQuantity"
          FROM ticket_products tp
          JOIN products p ON tp.product_id = p.id
          WHERE tp.ticket_id = t.id
          GROUP BY p.name
        ) as "passDetails"
      )
    )
    FROM tickets t
    WHERE t.booking_id = b.id
    LIMIT 1
  ) as ticket
FROM bookings b
WHERE b.user_id = $1
ORDER BY b.created_at DESC
LIMIT $2 OFFSET $3;
  `;

    const result = await query(sql, [userId, limit, offset]);

    // Clean up the result for the frontend
    const bookings = result.rows;

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
    const values = [];
    let paramIndex = 1;

    // 1. Build the dynamic WHERE clause
    let whereClause = "";
    if (status) {
      whereClause = `WHERE b.status = $${paramIndex}`;
      values.push(status.toUpperCase());
      paramIndex++;
    }

    const sql = `
    SELECT 
      b.id,
      b.booking_reference,
      b.user_id,
      b.total_amount,
      b.status AS booking_status,
      b.created_at,
      b.updated_at,
      u.first_name || ' ' || u.last_name AS customer_name,
      -- Determine Type: If any item is an EVENT, label as EVENT. Else GAME.
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM booking_items bi 
          JOIN ticket_types tt ON bi.ticket_type_id = tt.id
          JOIN products p ON tt.product_id = p.id
          WHERE bi.booking_id = b.id AND p.product_type = 'EVENT'
        ) THEN 'EVENT'
        ELSE 'GAME'
      END as type,
      -- Get Payment Info (Latest payment)
      (SELECT status FROM payments WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) as payment_status,
      (SELECT method FROM payments WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) as payment_method,
      -- Aggregate Items
      (
        SELECT json_agg(item_row)
        FROM (
          SELECT 
            bi.id,
            bi.booking_id,
            bi.ticket_type_id,
            bi.quantity,
            bi.unit_price,
            bi.subtotal,
            p.name as game_name,
            p.id as game_id,
            tt.category
          FROM booking_items bi
          JOIN ticket_types tt ON bi.ticket_type_id = tt.id
          JOIN products p ON tt.product_id = p.id
          WHERE bi.booking_id = b.id
        ) item_row
      ) as items
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    ${whereClause}
    ORDER BY b.created_at DESC 
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    values.push(limit, offset);
    const result = await query(sql, values);

    // Count logic
    let countSql = `SELECT COUNT(*) FROM bookings b`;
    if (status) countSql += ` WHERE b.status = $1`;
    const countResult = await query(
      countSql,
      status ? [status.toUpperCase()] : [],
    );

    return {
      bookings: result.rows.map((row) => ({
        ...row,
        items: row.items || [], // Ensure array is never null
      })),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
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
        `SELECT * FROM bookings WHERE id = $1 AND status = 'CONFIRMED' OR status = 'PENDING' FOR UPDATE`,
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
        `UPDATE bookings SET status = 'CANCELLED'
         WHERE id = $1`,
        [id],
      );

      // Update payment status
      await client.query(
        `UPDATE payments SET status = 'REFUNDED' WHERE booking_id = $1`,
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

const BookingStats = {
  getRange: (period = "d", startDate, endDate, interval = 1) => {
    const now = new Date();
    let start,
      end = endDate ? new Date(endDate) : now;

    // If startDate is provided, just use it
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) start = new Date(now);
    } else {
      // Determine start based on period string
      const periodRegex = /^(\d*)([dwm])$/;
      const match = period.match(periodRegex);
      const unit = match ? match[2] : "d";
      const num = parseInt(match ? match[1] : "1") || 1;

      switch (unit) {
        case "d":
          start = new Date();
          start.setDate(now.getDate() - 30 * num);
          break;
        case "w":
          start = new Date();
          start.setDate(now.getDate() - 12 * 7 * num);
          break;
        case "m":
          start = new Date();
          start.setMonth(now.getMonth() - 12 * num);
          break;
        default:
          start = new Date();
          start.setDate(now.getDate() - 30);
      }
    }

    // Ensure both are valid Dates
    if (!start || isNaN(start.getTime())) start = new Date(now);
    if (!end || isNaN(end.getTime())) end = new Date(now);

    return { start, end, unit: period[period.length - 1], interval };
  },

  // 2️⃣ General Stats remain mostly the same
  getGeneralStats: async (range) => {
    const sql = `
      WITH daily_stats AS (
        SELECT 
          DATE(created_at) as day,
          COUNT(id) as booking_count,
          SUM(total_amount) as revenue
        FROM bookings
        WHERE created_at BETWEEN $1 AND $2
          AND status = 'CONFIRMED'
        GROUP BY 1
      )
      SELECT 
        COALESCE(SUM(booking_count), 0)::INT as "total_bookings",
        COALESCE(ROUND(AVG(booking_count), 0), 0)::INT as "avg_bookings_per_day",
        COALESCE(MAX(booking_count), 0)::INT as "peak_bookings_day",
        COALESCE(SUM(revenue), 0)::NUMERIC as "total_revenue"
      FROM daily_stats;
    `;
    const res = await query(sql, [
      range.start.toISOString(),
      range.end.toISOString(),
    ]);
    return res.rows[0];
  },

  // 3️⃣ Ticket Trend with flexible interval
  getTicketTrend: async (range) => {
    let step;
    switch (range.unit) {
      case "d":
        step = `${range.interval} day`;
        break;
      case "w":
        step = `${range.interval} week`;
        break;
      case "m":
        step = `${range.interval} month`;
        break;
      default:
        step = "1 day";
    }

    const sql = `
      SELECT 
        gs.date,
        COALESCE(SUM(tickets),0) AS tickets,
        COALESCE(SUM(revenue),0) AS revenue
      FROM (
        SELECT generate_series($1::date, $2::date, '${step}')::date as date
      ) gs
      LEFT JOIN LATERAL (
        SELECT COUNT(ti.id) as tickets, SUM(b.total_amount) as revenue
        FROM bookings b
        LEFT JOIN tickets ti ON b.id = ti.booking_id
        WHERE b.status = 'CONFIRMED' AND DATE(b.created_at) BETWEEN gs.date AND gs.date + INTERVAL '${step}' - INTERVAL '1 second'
      ) AS sub ON true
      GROUP BY gs.date
      ORDER BY gs.date ASC;
    `;

    const res = await query(sql, [
      range.start.toISOString(),
      range.end.toISOString(),
    ]);
    return res.rows;
  },

  // 4️⃣ Event Bookings remain mostly the same
  getEventBookings: async (range) => {
    const sql = `
      SELECT 
        e.id,
        e.name as event,
        SUM(bi.quantity) as "tickets bought",
        e.capacity,
        SUM(bi.subtotal) as revenue
      FROM events e
      JOIN products p ON p.event_id = e.id
      JOIN ticket_types tt ON tt.product_id = p.id
      JOIN booking_items bi ON bi.ticket_type_id = tt.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE b.status = 'CONFIRMED' AND b.created_at >= $1
      GROUP BY e.id
      ORDER BY revenue DESC
    `;
    const res = await query(sql, [range.start.toISOString()]);
    return res.rows;
  },

  // 5️⃣ Top Games remain mostly the same
  getTopGames: async (range) => {
    const sql = `
      SELECT 
        g.id,
        g.name as game,
        SUM(bi.subtotal) as revenue,
        tt.category as "topTicketType",
        tt.price as "topTicketPrice",
        SUM(bi.quantity) as "topTicketSold"
      FROM games g
      JOIN products p ON p.game_id = g.id
      JOIN ticket_types tt ON tt.product_id = p.id
      JOIN booking_items bi ON bi.ticket_type_id = tt.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE b.status = 'CONFIRMED' AND b.created_at >= $1
      GROUP BY g.id, g.name, tt.category, tt.price
      ORDER BY revenue DESC
      LIMIT 5
    `;
    const res = await query(sql, [range.start.toISOString()]);
    return res.rows;
  },
};

module.exports = {
  Booking,
  BookingStats,
};
