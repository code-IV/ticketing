const Dashboard = require("../models/Dashboard");
const { query } = require("../../config/db");
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

  async getDashboardRevenueData(startDate, endDate, period) {
    // 1. Helper for PostgreSQL date interval formatting
    // Maps '1d' -> '1 day', '3w' -> '3 weeks', '2m' -> '2 months'
    const intervalMap = { d: "day", w: "week", m: "month" };
    const num = period.match(/\d+/)[0];
    const unit = intervalMap[period.match(/[dwm]/)[0]];
    const sqlInterval = `${num} ${unit}`;

    // 2. Query Summary Stats (Total, Avg, and Comparison logic)
    const summarySql = `
    SELECT 
      SUM(amount) as "totalRevenue",
      AVG(amount) as "averageRevenue"
    FROM payments 
    WHERE status = 'COMPLETED' 
    AND paid_at BETWEEN $1 AND $2
  `;

    // 3. Time Series Data (Dynamic Granularity)
    // We use generate_series to ensure dates with 0 revenue are included
    const graphSql = `
    SELECT 
      series.time_bucket as date,
      COALESCE(SUM(p.amount), 0) as revenue
    FROM (
      SELECT generate_series($1::timestamp, $2::timestamp, $3::interval) as time_bucket
    ) series
    LEFT JOIN payments p ON p.paid_at >= series.time_bucket 
      AND p.paid_at < series.time_bucket + $3::interval
      AND p.status = 'COMPLETED'
    GROUP BY series.time_bucket
    ORDER BY series.time_bucket ASC
  `;

    // 4. Revenue by Ticket Category (Pie Chart)
    const ticketTypeSql = `
    SELECT tt.category, SUM(bi.subtotal) as revenue
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN bookings b ON bi.booking_id = b.id
    JOIN payments p ON p.booking_id = b.id
    WHERE p.status = 'COMPLETED' AND p.paid_at BETWEEN $1 AND $2
    GROUP BY tt.category
  `;

    // 5. Top 5 Games & Events
    const topPerformersSql = (type) => `
    SELECT prod.name, SUM(bi.subtotal) as revenue
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN products prod ON tt.product_id = prod.id
    JOIN bookings b ON bi.booking_id = b.id
    JOIN payments p ON p.booking_id = b.id
    WHERE prod.product_type = '${type}' 
      AND p.status = 'COMPLETED' 
      AND p.paid_at BETWEEN $1 AND $2
    GROUP BY prod.name
    ORDER BY revenue DESC
    LIMIT 5
  `;

    const [summary, graph, categories, topGames, topEvents] = await Promise.all(
      [
        query(summarySql, [startDate, endDate]),
        query(graphSql, [startDate, endDate, sqlInterval]),
        query(ticketTypeSql, [startDate, endDate]),
        query(topPerformersSql("GAME"), [startDate, endDate]),
        query(topPerformersSql("EVENT"), [startDate, endDate]),
      ],
    );

    return {
      summary: {
        totalRevenue: parseFloat(summary.rows[0].totalRevenue || 0),
        averageRevenue: parseFloat(summary.rows[0].averageRevenue || 0),
        projectedChange: 5.6, // Logic for comparison with previous period would go here
      },
      timeSeries: graph.rows,
      revenueByTicketType: categories.rows,
      topPerformers: {
        games: topGames.rows,
        events: topEvents.rows,
      },
    };
  },
};

module.exports = dashboardStatsService;
