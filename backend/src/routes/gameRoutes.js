const express = require("express");
const router = express.Router();
const {
  gameController,
  gameStatsController,
} = require("../api/controllers/gamesController");
const { isAuthenticated } = require("../middleware/auth");
const { uuidParamRule, handleValidation } = require("../middleware/validate");

router.use(isAuthenticated);

router.post("/games", handleValidation, gameController.createGame);
router.patch(
  "/games/:id",
  uuidParamRule("id"),
  handleValidation,
  gameController.updateGame,
);
router.get("/games", handleValidation, gameController.getAllGames);
router.get(
  "/games/stats",
  handleValidation,
  gameStatsController.fetchGameDashboard,
);
router.get(
  "/games/stats/:id",
  uuidParamRule("id"),
  handleValidation,
  gameStatsController.getGameStats,
);
router.get(
  "/game/:id",
  uuidParamRule("id"),
  handleValidation,
  gameController.getGameWithId,
);
router.delete(
  "/game/:id",
  uuidParamRule("id"),
  handleValidation,
  gameController.deleteGameWithId,
);

module.exports = router;
