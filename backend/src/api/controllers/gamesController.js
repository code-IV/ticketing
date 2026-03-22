const { Game } = require("../models/Games");
const { GameService, GameStatsService } = require("../services/gameService");
const { apiResponse } = require("../../utils/helpers");

const GameController = {
  /**
   * POST api/admin/games  creategames
   */
  async createGame(req, res, next) {
    try {
      const { name, description, rules, status, ticket_types } = req.body;
      const game = await GameService.create({
        name,
        description,
        rules,
        status,
        ticket_types,
      });
      return apiResponse(res, 200, true, "Game updated successfully", { game });
    } catch (err) {
      next(err);
    }
  },
  /**
   * PATCH api/admin/games/:id to update game data
   */
  async updateGame(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, rules, status, ticket_types } = req.body;
      const game = await GameService.update(id, {
        name,
        description,
        rules,
        status,
        ticket_types,
      });
      return apiResponse(res, 201, true, "Game created successfully", { game });
    } catch (err) {
      next(err);
    }
  },
  /**
   * GET api/admin/games  read all games
   */
  async getAllGames(req, res, next) {
    try {
      const games = await GameService.getAll();
      return apiResponse(res, 200, true, "GET game successful", games);
    } catch (err) {
      next(err);
    }
  },
  /**
   * GET /api/games/buy - Get all open games with their ticket prices
   */
  async getActiveGames(req, res, next) {
    try {
      const games = await GameService.getActive();
      return apiResponse(res, 200, true, "GET game successful", games);
    } catch (err) {
      next(err);
    }
  },
  /**
   * GET api/admin/game/:id get game with id?
   */
  async getGameWithId(req, res, next) {
    try {
      const game = await GameService.getById(req.params.id);
      if (!game) {
        return apiResponse(res, 404, false, "Game not found");
      }
      return apiResponse(res, 200, true, "GET successful", game);
    } catch (err) {
      next(err);
    }
  },
  /**
   * DELET api/admin/game/:id delete game with id?
   */
  async deleteGameWithId(req, res, next) {
    try {
      await GameService.deleteById(req.params.id);
      return apiResponse(res, 200, true, "DELETE successful");
    } catch (err) {
      next(err);
    }
  },
};

const GameStatsController = {
  async fetchGameDashboard(req, res) {
    try {
      const { startDate, endDate, period } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required" });
      }

      // Default period to daily if not provided
      const granularity = period || "d";

      const data = await GameStatsService.getGameAnalytics(
        startDate,
        endDate,
        granularity,
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  async getGameStats(req, res) {
    try {
      const { gameId } = req.params;
      const { startDate, endDate, period = "1d" } = req.query;

      const stats = await GameStatsService.getGameStats(gameId, {
        startDate,
        endDate,
        period,
      });

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = { GameController, GameStatsController };
