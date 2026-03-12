const express = require("express");
const router = express.Router();
const buyTicketController = require("../api/controllers/buyTicketController");
const { isAuthenticated } = require("../middleware/auth");
const { handleValidation, purchaseTicketRules } = require("../middleware/validate");

// GET /api/buy/games - Get all open games (public endpoint)
router.get("/games", handleValidation, buyTicketController.getOpenGames);

// GET /api/buy/games/:id - Get single game details (public endpoint)
router.get("/games/:id", buyTicketController.getGameById);

// POST /api/buy/purchase - Purchase tickets for games (requires authentication)
router.post("/purchase", purchaseTicketRules, handleValidation, buyTicketController.purchaseTickets);

module.exports = router;