const { query } = require("../../config/db");

/**
 * Admin only queries
 */

const Dashboard = {
  async getUserAnalytics(period = "all_time") {
    // 1. Define the Date Filter using PostgreSQL syntax
    const periodMap = {
      today: "CURRENT_DATE",
      this_week: "NOW() - INTERVAL '7 days'",
      this_month: "DATE_TRUNC('month', CURRENT_DATE)",
      this_year: "DATE_TRUNC('year', CURRENT_DATE)",
      all_time: "'1900-01-01'",
    };

    const dateFilter = periodMap[period] || periodMap.all_time;

    // 2. Updated Query
    // Note: users_roles join table is removed; we now join users.role_id -> roles.id
    const sql = `
    SELECT 
      -- Booking Engagement (Assumes a bookings table exists with user_id)
      (SELECT COUNT(DISTINCT user_id)::INT FROM bookings WHERE status = 'CONFIRMED') as users_with_bookings,
      
      -- Total active users
      (SELECT COUNT(*)::INT FROM users WHERE is_active = true) as total_active_users,

      -- Role Distribution (Direct Join on users.role_id)
      (
        SELECT json_agg(role_distribution) 
        FROM (
            SELECT 
                r.name as role, 
                COUNT(u.id)::INT as count 
            FROM roles r
            LEFT JOIN users u ON r.id = u.role_id
            GROUP BY r.name
        ) role_distribution
      ) as role_distribution,

      -- Status Distribution
      (
        SELECT json_agg(stats) FROM (
            SELECT is_active, COUNT(*)::INT as count FROM users GROUP BY is_active
        ) stats
      ) as status_distribution,

      -- New Users in the selected period (Using the new schema's created_at)
      (SELECT COUNT(*)::INT FROM users WHERE created_at >= $1) as new_users_count,

      -- Total Users
      (SELECT COUNT(*)::INT FROM users) as total_users
  `;

    // Assuming 'knex' is your connection instance
    const result = await query(sql, [period]);
    const row = result.rows[0];

    return {
      bookingEngagement: {
        usersWithBookings: row.users_with_bookings || 0,
        totalActiveUsers: row.total_active_users || 0,
        percentage:
          row.total_users > 0
            ? ((row.users_with_bookings / row.total_users) * 100).toFixed(2)
            : 0,
      },
      roleDistribution: row.role_distribution || [],
      statusDistribution: row.status_distribution || [],
      periodStats: {
        newUsers: row.new_users_count || 0,
        totalUsers: row.total_users || 0,
        period: period,
      },
    };
  },

  async getDashboardStats(
    startDate,
    endDate,
    { period = "d", interval = 1 } = {},
  ) {
    // 1️⃣ Summary: Now using Uppercase ENUMs
    const summarySql = `
    SELECT 
      COALESCE(SUM(amount), 0) as "totalRevenue",
      (SELECT COALESCE(SUM(bi.quantity), 0) 
       FROM booking_items bi 
       JOIN bookings b ON bi.booking_id = b.id 
       WHERE b.status = 'CONFIRMED' AND b.created_at BETWEEN $1 AND $2
      ) as "totalTicketsSold",
      (SELECT COUNT(*) FROM games WHERE status = 'OPEN') as "activeGames"
    FROM payments 
    WHERE status = 'COMPLETED' AND paid_at BETWEEN $1 AND $2;
  `;

    // 2️⃣ Helper: Improved PostgreSQL Truncation
    // This logic groups by the bucket start date based on your interval
    let groupBy;
    const startStr = startDate.toISOString().split("T")[0];

    switch (period) {
      case "d":
        groupBy = `DATE_TRUNC('day', DATE '${startStr}' + (FLOOR(EXTRACT(EPOCH FROM (paid_at - DATE '${startStr}')) / (86400 * ${interval})) * ${interval} * INTERVAL '1 day'))`;
        break;
      case "w":
        groupBy = `DATE_TRUNC('week', paid_at)`; // Weeks usually start on Mondays in PG
        break;
      case "m":
        groupBy = `DATE_TRUNC('month', paid_at)`;
        break;
      default:
        groupBy = `DATE_TRUNC('day', paid_at)`;
    }

    // 3️⃣ Revenue Trend (Money in the bank)
    const revenueTrendSql = `
    SELECT ${groupBy}::date as date, SUM(amount)::numeric as revenue
    FROM payments
    WHERE status = 'COMPLETED' AND paid_at BETWEEN $1 AND $2
    GROUP BY date ORDER BY date ASC;
  `;

    // 4️⃣ Tickets Trend (Usage)
    // We use bookings.created_at to match when they were ordered
    const ticketsTrendSql = `
    SELECT DATE_TRUNC('day', b.created_at)::date as date, SUM(bi.quantity)::int as "ticketsSold"
    FROM booking_items bi
    JOIN bookings b ON bi.booking_id = b.id
    WHERE b.status = 'CONFIRMED' AND b.created_at BETWEEN $1 AND $2
    GROUP BY date ORDER BY date ASC;
  `;

    // 5️⃣ Top Games (Now joining via Products)
    const topGamesSql = `
    SELECT p.name as game, SUM(bi.subtotal)::numeric as revenue
    FROM booking_items bi
    JOIN ticket_types tt ON bi.ticket_type_id = tt.id
    JOIN products p ON tt.product_id = p.id
    JOIN bookings b ON bi.booking_id = b.id
    WHERE b.status = 'CONFIRMED' 
    AND b.created_at BETWEEN $1 AND $2
    AND p.product_type = 'GAME'
    GROUP BY p.name ORDER BY revenue DESC LIMIT 6;
  `;

    const [summaryRes, revTrendRes, topGamesRes, ticketsTrendRes] =
      await Promise.all([
        query(summarySql, [startDate, endDate]),
        query(revenueTrendSql, [startDate, endDate]),
        query(topGamesSql, [startDate, endDate]),
        query(ticketsTrendSql, [startDate, endDate]),
      ]);

    return {
      summary: summaryRes.rows[0],
      revenueTrend: revTrendRes.rows,
      topGames: topGamesRes.rows,
      ticketsTrend: ticketsTrendRes.rows,
    };
  },
};

module.exports = Dashboard;
