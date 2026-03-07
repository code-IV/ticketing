const { getClient } = require("../../config/db");
const {
  generateBookingReference,
  generateTicketCode,
  generateQRToken,
} = require("../../utils/helpers");
const { Booking, BookingStats } = require("../models/Booking");

const bookingService = {
  async bookEvent(payload) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      // Business Logic: Math & Code Generation

      if (!Array.isArray(payload?.items) || payload.items.length === 0) {
        throw new Error("Booking must include at least one item");
      }

      // Business Logic: Math & Code Generation
      const totalAmount = payload.items.reduce(
        (sum, i) => sum + i.quantity * i.unitPrice,
        0,
      );
      const bookingRef = generateBookingReference();

      // 1. Create Booking
      const booking = await Booking.createBooking(client, {
        reference: bookingRef,
        userId: payload.userId,
        total: totalAmount,
        guestEmail: payload.guestEmail,
        guestName: payload.guestName,
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
      for (const item of payload.items) {
        await Booking.addBookingItem(client, {
          ...item,
          bookingId: booking.id,
          subtotal: item.quantity * item.unitPrice,
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
