const express = require("express");
const { isAdmin } = require("../middleware/auth");
const metricsController = require("../controllers/metricsController");

const router = express.Router();

// Apply admin middleware to all analytics routes
router.use(isAdmin);

/**
 * GET /api/metrics/users
 * Get user metrics with optional date filtering
 * Query params: period
 */
router.get("/users", metricsController.getUserCountInPeriod);
module.exports = router;
