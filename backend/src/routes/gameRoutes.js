const express = require("express");
const router = express.Router();
const {
  GameController,
  GameStatsController,
} = require("../api/controllers/gamesController");
const { isAuthenticated } = require("../middleware/auth");
const { uuidParamRule, handleValidation } = require("../middleware/validate");

router.use(isAuthenticated);

router.get("/", handleValidation, GameController.getAllGames);
router.get("/buy", handleValidation, GameController.getActiveGames);
router.get("/stats", handleValidation, GameStatsController.fetchGameDashboard);
router.get(
  "/stats/:gameId",
  uuidParamRule("gameId"),
  handleValidation,
  GameStatsController.getGameStats,
);
router.get(
  "/:id",
  uuidParamRule("id"),
  handleValidation,
  GameController.getGameWithId,
);

module.exports = router;
