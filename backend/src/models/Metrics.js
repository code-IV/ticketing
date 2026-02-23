const { query } = require("../config/db");

/**
 * Admin only queries
 */

const metrics = {
  async getUserAnalytics(period = "all_time") {
    // 1. Base date filter logic for "New Users" and "Online Users"
    const dateFilter =
      {
        today: "CURRENT_DATE",
        this_week: "NOW() - INTERVAL '7 days'",
        this_month: "DATE_TRUNC('month', CURRENT_DATE)",
        this_year: "DATE_TRUNC('year', CURRENT_DATE)",
        all_time: "'1900-01-01'", // Effectively all time
      }[period] || "'1900-01-01'";

    // 2. Combined Query for all user stats
    // We use subqueries so we can get everything in one database round-trip
    const sql = `
      SELECT 
        -- Booking Engagement (Users who have at least one 'confirmed' booking)
        (SELECT COUNT(DISTINCT user_id)::INT FROM bookings WHERE booking_status = 'confirmed') as users_with_bookings,
        
        -- Total active users for percentage calculation
        (SELECT COUNT(*)::INT FROM users WHERE is_active = true) as total_active_users,

        -- Role Distribution (JSON Aggregation)
        (SELECT json_agg(roles) FROM (
            SELECT role, COUNT(*)::INT as count FROM users GROUP BY role
        ) roles) as role_distribution,

        -- Status Distribution
        (SELECT json_agg(stats) FROM (
            SELECT is_active, COUNT(*)::INT as count FROM users GROUP BY is_active
        ) stats) as status_distribution,

        -- New Users in the selected period
        (SELECT COUNT(*)::INT FROM users WHERE created_at >= ${dateFilter}) as new_users_count,

        -- Total Users ()
        (SELECT COUNT(*)::INT FROM users) as total_users
    `;

    const result = await query(sql);
    const row = result.rows[0];

    // Format the response for the frontend
    return {
      bookingEngagement: {
        usersWithBookings: row.users_with_bookings,
        totalActiveUsers: row.total_users,
        percentage:
          row.total_users > 0
            ? ((row.users_with_bookings / row.total_users) * 100).toFixed(2)
            : 0,
      },
      roleDistribution: row.role_distribution || [],
      statusDistribution: row.status_distribution || [],
      periodStats: {
        newUsers: row.new_users_count,
        totalUsers: row.total_users,
        period: period,
      },
    };
  },
};

module.exports = metrics;
