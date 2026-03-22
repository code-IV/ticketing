const express = require("express");
const router = express.Router();
const {
  GameController,
  GameStatsController,
} = require("../api/controllers/gamesController");
const { isAuthenticated } = require("../middleware/auth");
const { uuidParamRule, handleValidation } = require("../middleware/validate");

router.use(isAuthenticated);

router.post("/games", handleValidation, GameController.createGame);
router.patch(
  "/games/:id",
  uuidParamRule("id"),
  handleValidation,
  GameController.updateGame,
);
router.get("/games", handleValidation, GameController.getAllGames);
router.get(
  "/games/stats",
  handleValidation,
  GameStatsController.fetchGameDashboard,
);
router.get(
  "/games/stats/:gameId",
  uuidParamRule("gameId"),
  handleValidation,
  GameStatsController.getGameStats,
);
router.get(
  "/game/:id",
  uuidParamRule("id"),
  handleValidation,
  GameController.getGameWithId,
);
router.delete(
  "/game/:id",
  uuidParamRule("id"),
  handleValidation,
  GameController.deleteGameWithId,
);

module.exports = router;
