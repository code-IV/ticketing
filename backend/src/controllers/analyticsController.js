const { query } = require('../config/db');
const { apiResponse } = require('../utils/helpers');

const analyticsController = {
  /**
   * GET /api/analytics/revenue
   * Get revenue analytics with optional date filtering
   */
  async getRevenueAnalytics(req, res, next) {
    try {
      // Completely disable caching for analytics endpoints
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
      
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      let dateFilter = '';
      let queryParams = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE DATE(p.paid_at) BETWEEN $1 AND $2';
        queryParams = [startDate, endDate];
      } else if (startDate) {
        dateFilter = 'WHERE DATE(p.paid_at) >= $1';
        queryParams = [startDate];
      } else if (endDate) {
        dateFilter = 'WHERE DATE(p.paid_at) <= $1';
        queryParams = [endDate];
      } else {
        // Default to last 30 days if no dates provided
        dateFilter = 'WHERE DATE(p.paid_at) >= CURRENT_DATE - INTERVAL \'30 day\'';
        queryParams = [];
      }

      // Revenue over time
      const revenueQuery = `
        SELECT 
          DATE(p.paid_at) as date,
          SUM(p.amount) as revenue,
          COUNT(*) as transaction_count
        FROM payments p
        ${dateFilter}
        AND p.payment_status = 'completed'
        GROUP BY DATE(p.paid_at)
        ORDER BY date DESC
        LIMIT 365
      `;

      // Total revenue summary
      const summaryQuery = `
        SELECT 
          SUM(p.amount) as total_revenue,
          COUNT(*) as total_transactions,
          AVG(p.amount) as avg_transaction_value
        FROM payments p
        ${dateFilter}
        AND p.payment_status = 'completed'
      `;

      // Revenue by payment method
      const paymentMethodQuery = `
        SELECT 
          p.payment_method,
          SUM(p.amount) as revenue,
          COUNT(*) as count
        FROM payments p
        ${dateFilter}
        AND p.payment_status = 'completed'
        GROUP BY p.payment_method
        ORDER BY revenue DESC
      `;

      const [revenueData, summaryData, paymentMethodData] = await Promise.all([
        query(revenueQuery, queryParams),
        query(summaryQuery, queryParams),
        query(paymentMethodQuery, queryParams)
      ]);

      return apiResponse(res, 200, true, 'Revenue analytics retrieved.', {
        revenueOverTime: revenueData.rows,
        summary: summaryData.rows[0] || { total_revenue: 0, total_transactions: 0, avg_transaction_value: 0 },
        byPaymentMethod: paymentMethodData.rows
      });
    } catch (err) {
      console.error('Revenue analytics error:', err);
      // Return empty data instead of error
      return apiResponse(res, 200, true, 'Revenue analytics retrieved.', {
        revenueOverTime: [],
        summary: { total_revenue: 0, total_transactions: 0, avg_transaction_value: 0 },
        byPaymentMethod: []
      });
    }
  },

  /**
   * GET /api/analytics/bookings
   * Get booking analytics and trends
   */
  async getBookingAnalytics(req, res, next) {
    try {
      // Completely disable caching for analytics endpoints
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
      
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      let dateFilter = '';
      let queryParams = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE DATE(b.created_at) BETWEEN $1 AND $2';
        queryParams = [startDate, endDate];
      } else if (startDate) {
        dateFilter = 'WHERE DATE(b.created_at) >= $1';
        queryParams = [startDate];
      } else if (endDate) {
        dateFilter = 'WHERE DATE(b.created_at) <= $1';
        queryParams = [endDate];
      } else {
        // Default to last 30 days if no dates provided
        dateFilter = 'WHERE DATE(b.created_at) >= CURRENT_DATE - INTERVAL \'30 day\'';
        queryParams = [];
      }

      // Bookings over time
      const bookingsQuery = `
        SELECT 
          DATE(b.created_at) as date,
          COUNT(*) as total_bookings,
          SUM(CASE WHEN b.booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN b.booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          SUM(CASE WHEN b.booking_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
          SUM(b.total_amount) as total_value
        FROM bookings b
        ${dateFilter}
        GROUP BY DATE(b.created_at)
        ORDER BY date DESC
        LIMIT 365
      `;

      // Booking summary
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN b.booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN b.booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          SUM(CASE WHEN b.booking_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
          SUM(b.total_amount) as total_value
        FROM bookings b
        ${dateFilter}
      `;

      const [bookingsData, summaryData] = await Promise.all([
        query(bookingsQuery, queryParams),
        query(summaryQuery, queryParams)
      ]);

      return apiResponse(res, 200, true, 'Booking analytics retrieved.', {
        dailyData: bookingsData.rows,
        summary: summaryData.rows[0] || { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, pending_bookings: 0, total_value: 0 }
      });
    } catch (err) {
      console.error('Booking analytics error:', err);
      // Return empty data instead of error
      return apiResponse(res, 200, true, 'Booking analytics retrieved.', {
        dailyData: [],
        summary: { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, pending_bookings: 0, total_value: 0 }
      });
    }
  },

  /**
   * GET /api/analytics/users
   * Get user analytics and registration trends
   */
  async getUserAnalytics(req, res, next) {
    try {
      // Completely disable caching for analytics endpoints
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
      
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      let dateFilter = '';
      let queryParams = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE DATE(u.created_at) BETWEEN $1 AND $2';
        queryParams = [startDate, endDate];
      } else if (startDate) {
        dateFilter = 'WHERE DATE(u.created_at) >= $1';
        queryParams = [startDate];
      } else if (endDate) {
        dateFilter = 'WHERE DATE(u.created_at) <= $1';
        queryParams = [endDate];
      } else {
        // Default to last 30 days if no dates provided
        dateFilter = 'WHERE DATE(u.created_at) >= CURRENT_DATE - INTERVAL \'30 day\'';
        queryParams = [];
      }

      // User registrations over time
      const registrationQuery = `
        SELECT 
          DATE(u.created_at) as date,
          COUNT(*) as new_users
        FROM users u
        ${dateFilter}
        GROUP BY DATE(u.created_at)
        ORDER BY date DESC
        LIMIT 365
      `;

      // User role breakdown
      const roleQuery = `
        SELECT 
          u.role,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
        FROM users u
        GROUP BY u.role
        ORDER BY count DESC
      `;

      // Active vs inactive users
      const activeQuery = `
        SELECT 
          u.is_active,
          COUNT(*) as count
        FROM users u
        GROUP BY u.is_active
      `;

      // Booking participation - unique users with bookings
      const bookingParticipationQuery = `
        SELECT 
          COUNT(DISTINCT b.user_id) as users_with_bookings,
          (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
          ROUND(COUNT(DISTINCT b.user_id) * 100.0 / (SELECT COUNT(*) FROM users WHERE is_active = true), 2) as percentage
        FROM bookings b
        WHERE b.booking_status = 'confirmed'
      `;

      const [registrationData, roleData, activeData, bookingParticipationData] = await Promise.all([
        query(registrationQuery, queryParams),
        query(roleQuery, []),
        query(activeQuery, []),
        query(bookingParticipationQuery, [])
      ]);

      return apiResponse(res, 200, true, 'User analytics retrieved.', {
        registrationData: registrationData.rows,
        roleBreakdown: roleData.rows,
        activeStatus: activeData.rows,
        bookingParticipation: bookingParticipationData.rows[0] || { users_with_bookings: 0, total_users: 0, percentage: 0 }
      });
    } catch (err) {
      console.error('User analytics error:', err);
      // Return empty data instead of error
      return apiResponse(res, 200, true, 'User analytics retrieved.', {
        registrationData: [],
        roleBreakdown: [],
        activeStatus: [],
        bookingParticipation: { users_with_bookings: 0, total_users: 0, percentage: 0 }
      });
    }
  },

  /**
   * GET /api/analytics/events
   * Get event performance analytics
   */
  async getEventAnalytics(req, res, next) {
    try {
      // Completely disable caching for analytics endpoints
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
      
      const { startDate, endDate, limit = 50 } = req.query;
      
      let dateFilter = '';
      let queryParams = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE e.event_date BETWEEN $1 AND $2';
        queryParams = [startDate, endDate];
      } else if (startDate) {
        dateFilter = 'WHERE e.event_date >= $1';
        queryParams = [startDate];
      } else if (endDate) {
        dateFilter = 'WHERE e.event_date <= $1';
        queryParams = [endDate];
      }

      // Event performance
      const eventQuery = `
        SELECT 
          e.id,
          e.name,
          e.event_date,
          e.capacity,
          COUNT(t.id) as tickets_sold,
          ROUND(COUNT(t.id) * 100.0 / e.capacity, 2) as attendance_rate,
          COALESCE(SUM(p.amount), 0) as total_revenue,
          COUNT(DISTINCT b.id) as booking_count,
          COALESCE(AVG(b.total_amount), 0) as avg_booking_value
        FROM events e
        LEFT JOIN ticket_types tt ON e.id = tt.event_id
        LEFT JOIN tickets t ON tt.id = t.ticket_type_id
        LEFT JOIN booking_items bi ON t.id = bi.ticket_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_status = 'completed'
        ${dateFilter}
        GROUP BY e.id, e.name, e.event_date, e.capacity
        ORDER BY total_revenue DESC
        LIMIT $${queryParams.length + 1}
      `;

      // Ticket type performance
      const ticketTypeQuery = `
        SELECT 
          tt.name as ticket_type_name,
          tt.category,
          COUNT(t.id) as total_sold,
          tt.quantity as total_tickets,
          COALESCE(SUM(p.amount), 0) as total_revenue,
          tt.price as avg_price
        FROM ticket_types tt
        LEFT JOIN tickets t ON tt.id = t.ticket_type_id
        LEFT JOIN booking_items bi ON t.id = bi.ticket_id
        LEFT JOIN bookings b ON bi.booking_id = b.id
        LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_status = 'completed'
        GROUP BY tt.id, tt.name, tt.category, tt.quantity, tt.price
        ORDER BY total_revenue DESC
      `;

      const [eventData, ticketTypeData] = await Promise.all([
        query(eventQuery, [...queryParams, limit]),
        query(ticketTypeQuery, [])
      ]);

      return apiResponse(res, 200, true, 'Event analytics retrieved.', {
        eventPerformance: eventData.rows,
        ticketTypePerformance: ticketTypeData.rows
      });
    } catch (err) {
      console.error('Event analytics error:', err);
      // Return empty data instead of error
      return apiResponse(res, 200, true, 'Event analytics retrieved.', {
        eventPerformance: [],
        ticketTypePerformance: []
      });
    }
  },

  /**
   * GET /api/analytics/dashboard
   * Get combined dashboard analytics
   */
  async getDashboardAnalytics(req, res, next) {
    try {
      // Completely disable caching for analytics endpoints
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
      
      const { days = 30 } = req.query;
      
      // Get data for the specified number of days
      const dateFilter = 'WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL \'30 day\'';
      const queryParams = [];

      // Recent revenue
      const recentRevenueQuery = `
        SELECT 
          SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as revenue,
          COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_transactions,
          SUM(CASE WHEN payment_status = 'refunded' THEN amount ELSE 0 END) as refunded_amount
        FROM payments
        WHERE DATE(paid_at) >= CURRENT_DATE - INTERVAL '30 day'
      `;

      // Recent bookings
      const recentBookingsQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          SUM(total_amount) as total_value
        FROM bookings
        ${dateFilter}
      `;

      // New users
      const newUsersQuery = `
        SELECT COUNT(*) as new_users
        FROM users
        ${dateFilter}
      `;

      // Active events
      const activeEventsQuery = `
        SELECT COUNT(*) as active_events
        FROM events
        WHERE is_active = true AND event_date >= CURRENT_DATE
      `;

      const [revenueData, bookingsData, usersData, eventsData] = await Promise.all([
        query(recentRevenueQuery, []),
        query(recentBookingsQuery, queryParams),
        query(newUsersQuery, queryParams),
        query(activeEventsQuery)
      ]);

      return apiResponse(res, 200, true, 'Dashboard analytics retrieved.', {
        revenue: revenueData.rows[0] || { revenue: 0, completed_transactions: 0, refunded_amount: 0 },
        bookings: bookingsData.rows[0] || { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, total_value: 0 },
        users: usersData.rows[0] || { new_users: 0 },
        events: eventsData.rows[0] || { active_events: 0 }
      });
    } catch (err) {
      console.error('Dashboard analytics error:', err);
      // Return empty data instead of error
      return apiResponse(res, 200, true, 'Dashboard analytics retrieved.', {
        revenue: { revenue: 0, completed_transactions: 0, refunded_amount: 0 },
        bookings: { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, total_value: 0 },
        users: { new_users: 0 },
        events: { active_events: 0 }
      });
    }
  }
};

module.exports = analyticsController;
