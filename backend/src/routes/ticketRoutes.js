const express = require("express");
const router = express.Router();
const TicketController = require("../api/controllers/ticketController");
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
  TicketController.punchTicketPass,
);
router.post(
  "/validate/:code",
  bookingLimiter.writeBookingLimit,
  isAuthenticated,
  isAdmin,
  stringParamRule("code"),
  handleValidation,
  TicketController.validateTicket,
);

// Authenticated routes
router.get(
  "/my",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  TicketController.getMyTickets,
);
router.get(
  "/code/:code",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  stringParamRule("code"),
  handleValidation,
  TicketController.getTicketByCode,
);
router.get(
  "/game/:gameId",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  uuidParamRule("gameId"),
  handleValidation,
  TicketController.getGameTicketsDetails,
);
// everyone can see but only admin and staff can edit
router.get(
  "/scan",
  bookingLimiter.scan,
  ticketRules.scan,
  handleValidation,
  TicketController.scanTicket,
);

router.get(
  "/:id",
  bookingLimiter.getBookingLimit,
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  TicketController.getTicketById,
);

module.exports = router;
