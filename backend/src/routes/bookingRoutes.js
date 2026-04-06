const express = require("express");
const router = express.Router();
const bookingController = require("../api/controllers/bookingController");
const { isAuthenticated, isStaff, isAdmin } = require("../middleware/auth");
const {
  uuidParamRule,
  paginationRules,
  handleValidation,
} = require("../middleware/validate");
const {
  bookingValidator,
} = require("../middleware/validators/booking.validator");

// Remove global authentication - apply per route instead

// Event bookings - allow guests
router.post(
  "/event",
  bookingValidator.createEventBookingRules,
  handleValidation,
  bookingController.createBookingEvent,
);

// Game bookings - allow guests
router.post(
  "/games",
  bookingValidator.createGameBookingRules,
  handleValidation,
  bookingController.createBookingGames,
);

// User-specific routes require authentication
router.get(
  "/my",
  isAuthenticated,
  paginationRules,
  handleValidation,
  bookingController.getMyBookings,
);

// Admin-only routes
router.get("/stats", isAdmin, bookingController.getAnalytics);

// Public reference lookup
router.get("/reference/:reference", bookingController.getBookingByReference);

// Protected booking operations
router.get(
  "/:id",
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  bookingController.getBookingById,
);
router.post(
  "/:id/cancel",
  uuidParamRule("id"),
  handleValidation,
  bookingController.cancelBooking,
);
router.get(
  "/:id/tickets",
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  bookingController.getBookingTickets,
);

module.exports = router;
