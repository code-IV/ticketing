const express = require("express");
const router = express.Router();
const buyTicketController = require("../controllers/buyTicketController");
const { isAuthenticated } = require("../middleware/auth");
const { handleValidation, purchaseTicketRules } = require("../middleware/validate");

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// GET /api/buy/games - Get all open games
router.get("/games", handleValidation, buyTicketController.getOpenGames);

// POST /api/buy/purchase - Purchase tickets for games
router.post("/purchase", purchaseTicketRules, handleValidation, buyTicketController.purchaseTickets);

module.exports = router;