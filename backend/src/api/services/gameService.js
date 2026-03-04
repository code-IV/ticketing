const { GameStats } = require("../models/Games");

const gameStatsService = {
  async getGameStats(gameId, filters) {
    // Parse period like '2d' or '3w' into Postgres intervals
    // Defaulting to 1 day if parsing fails
    const periodMap = { d: "day", w: "week", m: "month" };
    const match = filters.period.match(/(\d+)([dwm])/);

    const intervalAmount = match ? match[1] : 1;
    const intervalUnit = match ? periodMap[match[2]] : "day";
    const fullInterval = `${intervalAmount} ${intervalUnit}`;

    const [summary, trends, ticketPerformance] = await Promise.all([
      GameStats.getGameSummary(gameId, filters),
      GameStats.getTrends(gameId, { ...filters, fullInterval }),
      GameStats.getTicketPerformance(gameId, filters),
    ]);

    return {
      totalRevenue: parseFloat(summary.total_revenue || 0),
      totalBookings: parseInt(summary.total_bookings || 0),
      revenueTrend: trends.map((t) => ({
        date: t.period_start,
        revenue: parseFloat(t.revenue),
      })),
      bookingsTrend: trends.map((t) => ({
        date: t.period_start,
        bookings: parseInt(t.bookings),
      })),
      topPerformingTickets: ticketPerformance,
    };
  },
};

module.exports = { gameStatsService };
