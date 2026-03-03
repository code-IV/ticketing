const Dashboard = require("../models/Dashboard");
const {
  subDays,
  subWeeks,
  subMonths,
  parseISO,
  startOfDay,
  endOfDay,
} = require("date-fns");

const dashboardStatsService = {
  /**
   * Fetch admin dashboard data with dynamic period and interval.
   * @param {Object} options
   * @param {string} options.period - e.g., "d", "2d", "w", "2m"
   * @param {string} options.start - ISO date string
   * @param {string} options.end - ISO date string
   */
  async getAdminDashboardData({ period = "d", start, end }) {
    // Parse period string like "d", "2d", "w", "2m"
    const periodRegex = /^(\d*)([dwm])$/;
    const match = period.match(periodRegex);

    const interval = match ? parseInt(match[1]) || 1 : 1;
    const unit = match ? match[2] : "d";

    // Parse or default end date
    const endDateObj = end ? endOfDay(parseISO(end)) : endOfDay(new Date());
    let startDateObj;

    // Determine default start date if not provided
    if (start) {
      startDateObj = startOfDay(parseISO(start));
    } else {
      switch (unit) {
        case "d":
          startDateObj = subDays(endDateObj, 30 * interval); // last 30 * interval days
          break;
        case "w":
          startDateObj = subWeeks(endDateObj, 12 * interval); // last 12 * interval weeks
          break;
        case "m":
          startDateObj = subMonths(endDateObj, 12 * interval); // last 12 * interval months
          break;
        default:
          startDateObj = subDays(endDateObj, 30); // fallback
      }
    }

    // Call the Dashboard model with proper Dates, unit and interval
    const data = await Dashboard.getDashboardStats(startDateObj, endDateObj, {
      period: unit, // "d", "w", "m"
      interval, // 1, 2, 3, etc.
    });

    // Normalize numbers
    return {
      summary: {
        totalRevenue: parseFloat(data.summary.totalRevenue),
        totalTicketsSold: parseInt(data.summary.totalTicketsSold),
        activeGames: parseInt(data.summary.activeGames),
      },
      revenueTrend: data.revenueTrend.map((r) => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
      })),
      topGames: data.topGames.map((g) => ({
        game: g.game,
        revenue: parseFloat(g.revenue),
      })),
      ticketsTrend: data.ticketsTrend.map((t) => ({
        date: t.date,
        ticketsSold: parseInt(t.ticketsSold),
      })),
    };
  },
};

module.exports = dashboardStatsService;
