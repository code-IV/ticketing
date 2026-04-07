const express = require("express");
const { isAdmin, isAuthenticated } = require("../middleware/auth");
const dashboardController = require("../api/controllers/dashboardController");
const { userLimiter } = require("../middleware/ratelimiting/user.limiter");

const router = express.Router();

// Apply admin middleware to all analytics routes
router.use(isAuthenticated, isAdmin);

/**
 * GET /api/metrics/users
 * Get user metrics with optional date filtering
 * Query params: period
 */
router.get(
  "/users",
  userLimiter.getUserLimiter,
  dashboardController.getUserCountInPeriod,
);
router.get(
  "/dashboard",
  userLimiter.getUserLimiter,
  dashboardController.getDashboard,
);
module.exports = router;
