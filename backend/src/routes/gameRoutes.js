const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gamesController");
const { isAuthenticated } = require("../middleware/auth");
const { handleValidation } = require("../middleware/validate");

router.use(isAuthenticated);

router.post("/games", handleValidation, gameController.createGame);
router.get("/games", handleValidation, gameController.getAllGames);

module.exports = router;
