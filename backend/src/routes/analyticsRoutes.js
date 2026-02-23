const express = require('express');
const { isAdmin } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Apply admin middleware to all analytics routes
router.use(isAdmin);

/**
 * GET /api/analytics/revenue
 * Get revenue analytics with optional date filtering
 * Query params: startDate, endDate, groupBy
 */
router.get('/revenue', analyticsController.getRevenueAnalytics);

/**
 * GET /api/analytics/bookings
 * Get booking analytics and trends
 * Query params: startDate, endDate, groupBy
 */
router.get('/bookings', analyticsController.getBookingAnalytics);

/**
 * GET /api/analytics/users
 * Get user analytics and registration trends
 * Query params: startDate, endDate, groupBy
 */
router.get('/users', analyticsController.getUserAnalytics);

/**
 * GET /api/analytics/events
 * Get event performance analytics
 * Query params: startDate, endDate, limit
 */
router.get('/events', analyticsController.getEventAnalytics);

/**
 * GET /api/analytics/dashboard
 * Get combined dashboard analytics for overview
 * Query params: days (default: 30)
 */
router.get('/dashboard', analyticsController.getDashboardAnalytics);

module.exports = router;
