const express = require("express");
const router = express.Router();
const adminController = require("../api/controllers/adminController");
const { EventController } = require("../api/controllers/eventController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const {
  uuidParamRule,
  paginationRules,
  handleValidation,
} = require("../middleware/validate");
const {
  createTicketTypeRules,
  updateTicketTypeRules,
} = require("../middleware/validators/ticketType.validator");
const { GameController } = require("../api/controllers/gamesController");
const bookingController = require("../api/controllers/bookingController");

// All admin routes require authentication + admin role
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// Ticket type management
router.post(
  "/ticket-types",
  createTicketTypeRules,
  handleValidation,
  adminController.createTicketType,
);
router.put(
  "/ticket-types/:id",
  uuidParamRule("id"),
  updateTicketTypeRules,
  handleValidation,
  adminController.updateTicketType,
);
router.delete(
  "/ticket-types/:id",
  uuidParamRule("id"),
  handleValidation,
  adminController.deleteTicketType,
);

// Booking management
router.get(
  "/bookings",
  paginationRules,
  handleValidation,
  adminController.getAllBookings,
);
router.get(
  "/bookings/:id",
  uuidParamRule("id"),
  handleValidation,
  adminController.getBookingDetails,
);
router.get(
  "/bookings/user/:id",
  uuidParamRule("id"),
  handleValidation,
  bookingController.getBookingByUserId,
);
router.post(
  "/bookings/:id/cancel",
  uuidParamRule("id"),
  handleValidation,
  adminController.cancelBooking,
);

// User management
router.get(
  "/users",
  paginationRules,
  handleValidation,
  adminController.getAllUsers,
);
router.get(
  "/search/users",
  paginationRules,
  handleValidation,
  adminController.searchUsers,
);
router.get(
  "/users/:id",
  uuidParamRule("id"),
  handleValidation,
  adminController.getUserById,
);
router.patch(
  "/users/:id",
  uuidParamRule("id"),
  handleValidation,
  adminController.updateUser,
);
router.patch(
  "/users/:id/toggle-active",
  uuidParamRule("id"),
  handleValidation,
  adminController.toggleUserActive,
);

// Reports
router.get("/reports/revenue", adminController.getRevenueSummary);
router.get("/reports/daily-revenue", adminController.getDailyRevenue);
router.get(
  "/reports/payments",
  paginationRules,
  handleValidation,
  adminController.getAllPayments,
);

module.exports = router;
