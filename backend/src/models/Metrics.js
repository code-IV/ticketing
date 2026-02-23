const { query } = require("../config/db");

/**
 * Admin only queries
 */

const metrics = {
  /**
   * User Metrics
   */
  async countUsersCreated(period) {
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
                WHEN $1 = 'all_time'
                THEN TRUE
                ELSE FALSE 
            END
        `;

    const result = await query(sql, [period]);
    return result.rows[0] || { user_count: 0 };
  },
};

module.exports = metrics;
