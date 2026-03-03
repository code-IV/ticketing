const express = require("express");
const { isAdmin } = require("../middleware/auth");
const dashboardController = require("../api/controllers/dashboardController");

const router = express.Router();

// Apply admin middleware to all analytics routes
router.use(isAdmin);

/**
 * GET /api/metrics/users
 * Get user metrics with optional date filtering
 * Query params: period
 */
router.get("/users", dashboardController.getUserCountInPeriod);
router.get("/dashboard", dashboardController.getDashboard);
module.exports = router;
