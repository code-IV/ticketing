const express = require("express");
const router = express.Router();
const buyTicketController = require("../api/controllers/buyTicketController");
const { isAuthenticated } = require("../middleware/auth");
const { handleValidation } = require("../middleware/validate");
const { ticketRules } = require("../middleware/validators/buy.validator");

// POST /api/buy/purchase - Purchase tickets for games (requires authentication)
router.post(
  "/purchase",
  ticketRules.purchaseTicketRules,
  handleValidation,
  buyTicketController.purchaseTickets,
);

module.exports = router;
