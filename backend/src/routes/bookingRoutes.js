const express = require("express");
const router = express.Router();
const bookingController = require("../api/controllers/bookingController");
const { isAuthenticated, isStaff, isAdmin } = require("../middleware/auth");
const {
  uuidParamRule,
  paginationRules,
  handleValidation,
  stringParamRule,
} = require("../middleware/validate");
const {
  bookingValidator,
} = require("../middleware/validators/booking.validator");
const {
  bookingLimiter,
} = require("../middleware/ratelimiting/booking.limiter");

// Remove global authentication - apply per route instead

// Event bookings - allow guests
router.post(
  "/event",
  bookingLimiter.createBookingLimit,
  bookingValidator.createEventBookingRules,
  handleValidation,
  bookingController.createBookingEvent,
);

// Game bookings - allow guests
router.post(
  "/games",
  bookingLimiter.createBookingLimit,
  bookingValidator.createGameBookingRules,
  handleValidation,
  bookingController.createBookingGames,
);

// User-specific routes require authentication
router.get(
  "/my",
  bookingLimiter.myBookingLimit,
  isAuthenticated,
  paginationRules,
  handleValidation,
  bookingController.getMyBookings,
);

// Admin-only routes
router.get(
  "/stats",
  bookingLimiter.bookingStatsLimit,
  isAdmin,
  bookingController.getAnalytics,
);

// Public reference lookup
router.get(
  "/reference/:reference",
  bookingLimiter.getBookingLimit,
  stringParamRule("reference"),
  bookingController.getBookingByReference,
);

// Protected booking operations
router.get(
  "/:id",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  bookingController.getBookingById,
);
router.post(
  "/:id/cancel",
  bookingLimiter.writeBookingLimit,
  uuidParamRule("id"),
  handleValidation,
  bookingController.cancelBooking,
);
router.get(
  "/:id/tickets",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  bookingController.getBookingTickets,
);

module.exports = router;
