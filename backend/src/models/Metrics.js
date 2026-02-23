const { query } = require("../config/db");

/**
 * Admin only queries
 */

const metrics = {
  /**
   * User Metrics
   */
  async countUsersCreated(period) {
    const validPeriods = [
      "today",
      "this_week",
      "this_month",
      "this_year",
      "all_time",
    ];
    if (!validPeriods.includes(period)) {
      throw new Error(
        `Invalid period: ${period}. Must be one of: ${validPeriods.join(", ")}`,
      );
    }

    const sql = `
            SELECT COUNT(*)::INT AS user_count
            FROM users
            WHERE 
            CASE 
                WHEN $1 = 'today' 
                THEN created_at >= CURRENT_DATE
                WHEN $1 = 'this_week' 
                THEN created_at >= NOW() - INTERVAL '7 days'
                WHEN $1 = 'this_month' 
                THEN created_at >= DATE_TRUNC('month', CURRENT_DATE)
                WHEN $1 = 'this_year' 
                THEN created_at >= DATE_TRUNC('year', CURRENT_DATE)
                ELSE FALSE 
            END
        `;

    const result = await query(sql, [period]);
    return result.rows[0] || { user_count: 0 };
  },
};

module.exports = metrics;
