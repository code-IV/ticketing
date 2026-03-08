const { EventStats } = require("../models/Event");

const eventStatsService = {
  async getEventsWithStats(startDate, endDate, period) {
    // Regex to split '2m' into '2' and 'months'
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) throw new Error("Invalid period format. Use e.g., 2d, 3w, 1m");

    const [_, value, unit] = match;
    const unitMap = { d: "days", w: "weeks", m: "months", y: "years" };
    const interval = `${value} ${unitMap[unit]}`;

    return await EventStats.fetchEventsByRange(startDate, endDate, interval);
  },
  async getEventAnalytics(eventId, filters) {
    // 1. Fetch static totals and ticket type breakdown
    const [summary, ticketBreakdown, trends] = await Promise.all([
      EventStats.getEventSummary(eventId),
      EventStats.getTicketTypeStats(eventId),
      EventStats.getTrends(eventId, filters),
    ]);

    return {
      name: summary.name || "",
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
