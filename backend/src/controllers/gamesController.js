const Game = require("../models/Games");
const { apiResponse } = require("../utils/helpers");

const gameController = {
  /**
   * POST api/admin/games  creategames
   */
  async createGame(req, res, next) {
    try {
      const { name, description, rules, status, ticket_types } = req.body;
      const game = await Game.create({
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
      const game = await Game.update(id, {
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
      const games = await Game.getAll();
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
      const game = await Game.getById(req.params.id);
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
      await Game.deleteById(req.params.id);
      return apiResponse(res, 200, true, "DELETE successful");
    } catch (err) {
      next(err);
    }
  },
};
module.exports = gameController;
