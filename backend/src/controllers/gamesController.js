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
};
module.exports = gameController;
