const express = require("express");
const router = express.Router();
const ticketController = require("../api/controllers/ticketController");
const { isAuthenticated, isAdmin, isStaff } = require("../middleware/auth");
const { uuidParamRule, handleValidation } = require("../middleware/validate");

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
router.get(
  "/:id",
  isAuthenticated,
  uuidParamRule("id"),
  handleValidation,
  ticketController.getTicketById,
);
// Admin only - validate ticket at gate
router.get(
  "/scan/:token",
  isAuthenticated,
  uuidParamRule("token"),
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

module.exports = router;
