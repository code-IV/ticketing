const express = require("express");
const router = express.Router();
const {
  GameController,
  GameStatsController,
} = require("../api/controllers/gamesController");
const { uuidParamRule, handleValidation } = require("../middleware/validate");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { gameRules } = require("../middleware/validators/game.validator");

// ==============
// WRITE GAME
// ==============

router.post(
  "/add",
  isAuthenticated,
  isAdmin,
  gameRules.create,
  handleValidation,
  GameController.createGame,
);
router.patch(
  "/patch/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  gameRules.update,
  handleValidation,
  GameController.updateGame,
);
router.delete(
  "/del/:id",
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
  isAuthenticated,
  isAdmin,
  GameStatsController.fetchGameDashboard,
);

// ==============
// READ GAME
// ==============

router.get("/all", GameController.getAllGames);
router.get("/", GameController.getActiveGames);
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
