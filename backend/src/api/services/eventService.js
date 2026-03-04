const { EventStats } = require("../models/Event");

const eventStatsService = {
  async getEventAnalytics(eventId, filters) {
    // 1. Fetch static totals and ticket type breakdown
    const [summary, ticketBreakdown, trends] = await Promise.all([
      EventStats.getEventSummary(eventId),
      EventStats.getTicketTypeStats(eventId),
      EventStats.getTrends(eventId, filters),
    ]);

    return {
      revenue: parseFloat(summary.total_revenue || 0),
      ticketsSold: parseInt(summary.tickets_sold || 0),
      capacity: parseInt(summary.capacity || 0),
      revenueTrend: trends.revenueTrend,
      bookingTrend: trends.bookingTrend,
      revenueByTicketType: ticketBreakdown.map((t) => ({
        type: t.type,
        revenue: parseFloat(t.revenue),
      })),
      bookingsByTicketType: ticketBreakdown.map((t) => ({
        type: t.type,
        sold: parseInt(t.sold),
      })),
      ticketTypesTable: ticketBreakdown,
    };
  },
};

module.exports = { eventStatsService };
