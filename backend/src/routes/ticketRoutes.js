const express = require("express");
const router = express.Router();
const ticketController = require("../api/controllers/ticketController");
const { isAuthenticated, isAdmin, isStaff } = require("../middleware/auth");
const { uuidParamRule, handleValidation } = require("../middleware/validate");
const { scanTicketRules } = require("../middleware/validators/buy.validator");

// Authenticated routes
router.get("/my", isAuthenticated, ticketController.getMyTickets);
router.get("/code/:code", isAuthenticated, ticketController.getTicketByCode);
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
  scanTicketRules,
  handleValidation,
  ticketController.scanTicket,
);
router.post(
  "/punch",
  isAuthenticated,
  isStaff,
  ticketController.punchTicketPass,
);
router.post(
  "/validate/:code",
  isAuthenticated,
  isAdmin,
  ticketController.validateTicket,
);

router.get(
  "/:id",
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  ticketController.getTicketById,
);

module.exports = router;
