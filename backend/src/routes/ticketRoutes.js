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

router.post(
  "/punch",
  isAuthenticated,
  isStaff,
  ticketRules.punch,
  handleValidation,
  ticketController.punchTicketPass,
);
router.post(
  "/validate/:code",
  isAuthenticated,
  isAdmin,
  stringParamRule("code"),
  handleValidation,
  ticketController.validateTicket,
);

// Authenticated routes
router.get("/my", isAuthenticated, ticketController.getMyTickets);
router.get(
  "/code/:code",
  isAuthenticated,
  stringParamRule("code"),
  handleValidation,
  ticketController.getTicketByCode,
);
router.get(
  "/game/:gameId",
  isAuthenticated,
  uuidParamRule("gameId"),
  handleValidation,
  ticketController.getGameTicketsDetails,
);
// everyone can see but only admin and staff can edit
router.get(
  "/scan",
  ticketRules.scan,
  handleValidation,
  ticketController.scanTicket,
);

router.get(
  "/:id",
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  ticketController.getTicketById,
);

module.exports = router;
