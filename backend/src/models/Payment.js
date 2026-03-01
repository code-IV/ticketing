const { query } = require("../config/db");

const Payment = {
  /**
   * Find payment by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM payments WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find payments for a booking
   */
  async findByBookingId(bookingId) {
    const sql = `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC`;
    const result = await query(sql, [bookingId]);
    return result.rows;
  },

  /**
   * Get all payments (admin)
   */
  async findAll({ page = 1, limit = 20, status = null }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT p.*,
             b.booking_reference,
             u.first_name || ' ' || u.last_name AS customer_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.user_id = u.id`;
    const values = [];
    let paramIndex = 1;

    if (status) {
      sql += ` WHERE p.payment_status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);

    let countSql = `SELECT COUNT(*) FROM payments`;
    const countValues = [];
    if (status) {
      countSql += ` WHERE payment_status = $1`;
      countValues.push(status);
    }
    const countResult = await query(countSql, countValues);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      payments: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get revenue summary (admin)/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
   */
  async getRevenueSummary() {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::INT AS total_transactions,
        COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0)::TEXT AS total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'REFUNDED'), 0)::TEXT AS total_refunded,
        COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED' AND paid_at >= CURRENT_DATE), 0)::TEXT AS today_revenue,
        COUNT(*) FILTER (WHERE status = 'COMPLETED' AND paid_at >= CURRENT_DATE)::INT AS today_transactions
      FROM payments;
`;
    const result = await query(sql);
    return result.rows[0];
  },

  /**
   * Get daily revenue for a date range (admin reports)
   */
  async getDailyRevenue(startDate, endDate) {
    const sql = `
      SELECT
        DATE(paid_at) AS date,
        COUNT(*) AS transactions,
        SUM(amount) AS revenue
      FROM payments
      WHERE payment_status = 'completed'
        AND paid_at >= $1
        AND paid_at <= $2
      GROUP BY DATE(paid_at)
      ORDER BY date ASC`;
    const result = await query(sql, [startDate, endDate]);
    return result.rows;
  },
};

module.exports = Payment;
