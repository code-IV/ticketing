const express = require("express");
const router = express.Router();
const {
  GameController,
  GameStatsController,
} = require("../api/controllers/gamesController");
const { uuidParamRule, handleValidation } = require("../middleware/validate");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { gameRules } = require("../middleware/validators/game.validator");
const { gameLimiter } = require("../middleware/ratelimiting/game.limiter");

// ==============
// WRITE GAME
// ==============

router.post(
  "/add",
  gameLimiter.createLimit,
  isAuthenticated,
  isAdmin,
  gameRules.create,
  handleValidation,
  GameController.createGame,
);
router.patch(
  "/patch/:id",
  gameLimiter.writeLimit,
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  gameRules.update,
  handleValidation,
  GameController.updateGame,
);
router.delete(
  "/del/:id",
  gameLimiter.createLimit,
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  GameController.deleteGameWithId,
);

// ==============
// PRIVATE READ
// ==============
router.get(
  "/stats",
  gameLimiter.statsLimit,
  isAuthenticated,
  isAdmin,
  GameStatsController.fetchGameDashboard,
);
router.get(
  "/stats/:gameId",
  gameLimiter.statsLimit,
  uuidParamRule("gameId"),
  handleValidation,
  GameStatsController.getGameStats,
);

// ==============
// READ GAME
// ==============

router.get("/all", gameLimiter.getAllLimit, GameController.getAllGames);
router.get("/", gameLimiter.listLimit, GameController.getActiveGames);

router.get(
  "/:id",
  gameLimiter.listLimit,
  uuidParamRule("id"),
  handleValidation,
  GameController.getGameWithId,
);

module.exports = router;
