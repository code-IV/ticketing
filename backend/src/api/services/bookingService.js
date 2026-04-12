const { getClient } = require("../../config/db");
const {
  generateBookingReference,
  generateTicketCode,
  generateQRToken,
} = require("../../utils/helpers");
const PromotionEngine = require("../../utils/promotinEngine");
const { Booking, BookingStats } = require("../models/Booking");
const { Discount } = require("../models/Discount");

const bookingService = {
  async bookEvent(payload, user = null) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // Business Logic: Math & Code Generation

      if (!Array.isArray(payload?.items) || payload.items.length === 0) {
        throw new Error("Booking must include at least one item");
      }

      let totalAmount = 0;
      const enrichedItems = [];

      for (const item of payload.items) {
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
      const bookingRef = generateBookingReference();

      // 1. Create Booking
      const booking = await Booking.createBooking(client, {
        reference: bookingRef,
        userId: payload.userId,
        total: totalAmount,
      });

      // 2. Create Master Ticket (Security/Logic belongs here)
      const ticketCode = generateTicketCode();
      const qrToken = generateQRToken();

      const ticket = await Booking.createMasterTicket(client, {
        bookingId: booking.id,
        code: ticketCode,
        token: qrToken,
        expiresAt: payload.expires_at,
      });

      // 3. Process Items
      for (const item of enrichedItems) {
        await Booking.addBookingItem(client, {
          ...item,
          bookingId: booking.id,
        });

        await Booking.createEntitlement(client, {
          ticketId: ticket.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
        });

        await Booking.updateEventCapacity(
          client,
          item.ticketTypeId,
          item.quantity,
        );
      }

      // 4. Record Payment
      await Booking.recordPayment(client, {
        bookingId: booking.id,
        amount: totalAmount,
        method: payload.paymentMethod.toUpperCase() ?? "PENDING",
      });

      await client.query("COMMIT");
      return { ...booking, ticket };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

const bookingStatsService = {
  getDashboardStats: async ({ period = "d", start, end } = {}) => {
    // 1️⃣ Parse period string (e.g., "d", "2d", "w", "2w", "m", "2m")
    const periodRegex = /^(\d*)([dwm])$/;
    const match = period.match(periodRegex);

    if (!match) {
      throw new Error("Invalid period format");
    }

    const interval = parseInt(match[1]) || 1; // default to 1
    const unit = match[2]; // "d", "w", "m"

    // 2️⃣ Validate and parse dates
    if (!start || !end) {
      throw new Error("startDate and endDate are required");
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date format");
    }

    // 3️⃣ Build range object for model methods
    const range = BookingStats.getRange(period, startDate, endDate);

    // 4️⃣ Fetch all stats in parallel
    const [general, trend, events, games] = await Promise.all([
      BookingStats.getGeneralStats(range),
      BookingStats.getTicketTrend(range),
      BookingStats.getEventBookings(range),
      BookingStats.getTopGames(range),
    ]);

    return {
      bookingData: [general],
      gameBookingData: trend,
      eventBookingData: events,
      topGameData: games,
    };
  },
};

module.exports = { bookingService, bookingStatsService };
