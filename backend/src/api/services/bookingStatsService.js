const { BookingStats } = require("../models/Booking");

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

module.exports = bookingStatsService;
