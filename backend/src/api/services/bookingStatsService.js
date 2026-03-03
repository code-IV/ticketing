const { BookingStats } = require("../models/Booking");
const bookingStatsService = {
  getDashboardStats: async (period, start, end) => {
    const range = BookingStats.getRange(period, start, end);

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
