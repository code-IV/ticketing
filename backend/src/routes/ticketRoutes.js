const express = require("express");
const router = express.Router();
const ticketController = require("../api/controllers/ticketController");
const { isAuthenticated, isAdmin, isStaff } = require("../middleware/auth");
const {
  uuidParamRule,
  handleValidation,
  stringParamRule,
} = require("../middleware/validate");
const { ticketRules } = require("../middleware/validators/buy.validator");
const {
  bookingLimiter,
} = require("../middleware/ratelimiting/booking.limiter");

router.post(
  "/punch",
  bookingLimiter.punch,
  isAuthenticated,
  isStaff,
  ticketRules.punch,
  handleValidation,
  ticketController.punchTicketPass,
);
router.post(
  "/validate/:code",
  bookingLimiter.writeBookingLimit,
  isAuthenticated,
  isAdmin,
  stringParamRule("code"),
  handleValidation,
  ticketController.validateTicket,
);

// Authenticated routes
router.get(
  "/my",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  ticketController.getMyTickets,
);
router.get(
  "/code/:code",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  stringParamRule("code"),
  handleValidation,
  ticketController.getTicketByCode,
);
router.get(
  "/game/:gameId",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  uuidParamRule("gameId"),
  handleValidation,
  ticketController.getGameTicketsDetails,
);
// everyone can see but only admin and staff can edit
router.get(
  "/scan",
  bookingLimiter.scan,
  ticketRules.scan,
  handleValidation,
  ticketController.scanTicket,
);

router.get(
  "/:id",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  ticketController.getTicketById,
);

module.exports = router;
