const express = require("express");
const router = express.Router();
const bookingController = require("../api/controllers/bookingController");
const { isAuthenticated, isStaff, isAdmin } = require("../middleware/auth");
const {
  createBookingRules,
  uuidParamRule,
  paginationRules,
  handleValidation,
} = require("../middleware/validate");

// All booking routes require authentication
router.use(isAuthenticated);

router.post(
  "/event",
  createBookingRules,
  handleValidation,
  bookingController.createBookingEvent,
);
router.post("/games", handleValidation, bookingController.createBookingGames);
router.get(
  "/my",
  paginationRules,
  handleValidation,
  bookingController.getMyBookings,
);
router.get("/stats", isAdmin, bookingController.getAnalytics);
router.get("/reference/:reference", bookingController.getBookingByReference);
router.get(
  "/:id",
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
  uuidParamRule("id"),
  handleValidation,
  bookingController.getBookingTickets,
);

module.exports = router;
