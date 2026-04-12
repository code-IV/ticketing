const { getClient } = require("../../config/db");
const PromotionEngine = require("../../utils/promotinEngine");
const { checkUploadBySid } = require("../../utils/uploads");
const { GameRes } = require("../dtos/gameDto");
const { Discount } = require("../models/Discount");
const { Game, GameStats } = require("../models/Games");
const TicketType = require("../models/TicketType");
const { Sessions, Media } = require("../models/uploads");
const UploadsService = require("./uploadsService");

const GameService = {
  async create(gameData, sessionId) {
    const { name, description, rules, status, ticketTypes } = gameData;
    const client = await getClient();

    try {
      const files = sessionId
        ? await UploadsService.validateSession(sessionId)
        : [];
      await client.query("BEGIN");
      // 1. Create the base Game
      const newGame = await Game.createGame(client, {
        name,
        description,
        rules,
        status,
      });

      // 2. Create the Product wrapper
      const productId = await Game.createProduct(client, {
        name: newGame.name,
        gameId: newGame.id,
      });

      for (const type of ticketTypes || []) {
        await TicketType.create({ ...type, productId }, client);
      }

      for (const file of files || []) {
        await Media.createMedia(file, client);
        await Media.linkProductMedia(productId, file.id, client);
      }

      if (sessionId) {
        await Sessions.updateSession(sessionId, client);
      }

      await client.query("COMMIT");

      return { game: newGame, productId: productId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id, gameData, sessionId) {
    const { productId, name, description, rules, status, ticketTypes } =
      gameData;
    const client = await getClient();

    try {
      const files = sessionId
        ? await UploadsService.validateSession(sessionId)
        : [];
      await client.query("BEGIN");

      // Task 1: Update the game itself
      const updatedGame = await Game.updateGame(client, id, {
        name,
        description,
        rules,
        status,
      });

      // Task 2: Update tickets if provided
      for (const type of ticketTypes || []) {
        await TicketType.update({ ...type, productId }, client);
      }

      for (const file of files || []) {
        await Media.createMedia(file, client);
        await Media.linkProductMedia(productId, file.id, client);
      }

      if (sessionId) {
        await Sessions.updateSession(sessionId, client);
      }
      await client.query("COMMIT");
      return updatedGame;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Service Error - Update Game failed:", error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getAll() {
    try {
      const rows = await Game.findAll();

      return { games: rows.map((row) => new GameRes(row)) };
    } catch (error) {
      console.error("Error in gameService.getAllGames:", error);
      throw new Error("Could not retrieve games catalog.");
    }
  },
  async getActive(user) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      const rows = await Game.findActive();
      const activePromos = await Discount.getApplicablePromos(
        rows.map((r) => r.product_id),
        client,
      );
      const gamesWithDiscounts = rows.map((game) => {
        const gameResult = new GameRes(game);

        // Enrich each ticket type with its own discount
        const enrichedTicketTypes = game.ticket_types.map((tt) => {
          let bestDiscount = 0;
          let name = "";

          activePromos.forEach((promo) => {
            const promoContext = {
              userId: user?.id,
              isAuthenticated: !!user,
              ticketTypeIds: [tt.id], // only this ticket type
              cartTotal: 0,
            };
            if (
              promo.rules?.length > 0 &&
              PromotionEngine.validateRules(promo.rules, promoContext)
            ) {
              const discount = PromotionEngine.calculateDiscount(
                tt.price,
                promo.rules[0],
              );

              if (discount > bestDiscount) {
                bestDiscount = discount;
                name = promo.name;
              }
            }
          });

          // optionally cap discount so final price >= 0
          const finalPrice = Math.max(0, tt.price - bestDiscount);

          return {
            ...tt,
            discount: {
              discountName: name,
              discountAmount: bestDiscount,
              finalPrice,
            },
          };
        });

        return {
          ...gameResult,
          ticketTypes: enrichedTicketTypes, // if you want game‑level
        };
      });
      await client.query("COMMIT");
      return { games: gamesWithDiscounts };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in gameService.getActive:", error);
      throw new Error("Could not retrieve games catalog.");
    } finally {
      client.release();
    }
  },

  async getById(id) {
    try {
      const game = await Game.findById(id);

      return { game: new GameRes(game) };
    } catch (error) {
      console.error("Error in gameService.getById:", error);
      throw new Error("Could not retrieve games catalog.");
    }
  },

  async deleteById(id) {
    try {
      const games = await Game.deleteGame(id);
      return games;
    } catch (error) {
      console.error("Error in gameService.deleteById:", error);
      throw new Error("Could not delete games catalog.");
    }
  },
};

const GameStatsService = {
  async getGameAnalytics(startDate, endDate, period) {
    const rawData = await GameStats.getRawGameStats(startDate, endDate);

    // 1. Format for Bar Charts (Top 5)
    const revenueByGame = rawData
      .map((d) => ({ game: d.name, revenue: parseFloat(d.total_revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const ticketsByGame = rawData
      .map((d) => ({ game: d.name, tickets: parseInt(d.tickets_sold) }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 5);

    // 2. Format Table Data
    const tableData = rawData.map((d) => ({
      id: d.id,
      name: d.name,
      status: d.status,
      totalRevenue: parseFloat(d.total_revenue),
      ticketsSold: parseInt(d.tickets_sold),
      topTicketType: d.top_ticket_type || "N/A",
      topTicketPrice: parseFloat(d.top_ticket_price || 0),
      topTicketSold: 0, // You can add logic to aggregate this specifically
    }));

    // 3. Overall Summary
    const summary = {
      totalRevenue: revenueByGame.reduce((acc, curr) => acc + curr.revenue, 0),
      totalTickets: ticketsByGame.reduce((acc, curr) => acc + curr.tickets, 0),
      topPerformingGame: revenueByGame[0]?.game || "None",
    };

    return { summary, revenueByGame, ticketsByGame, tableData };
  },
  async getGameStats(gameId, filters) {
    // Parse period like '2d' or '3w' into Postgres intervals
    // Defaulting to 1 day if parsing fails
    const periodMap = { d: "day", w: "week", m: "month" };
    const match = filters.period.match(/(\d+)([dwm])/);

    const intervalAmount = match ? match[1] : 1;
    const intervalUnit = match ? periodMap[match[2]] : "day";
    const fullInterval = `${intervalAmount} ${intervalUnit}`;

    const [summary, trends, ticketPerformance] = await Promise.all([
      GameStats.getGameSummary(gameId, filters),
      GameStats.getTrends(gameId, { ...filters, fullInterval }),
      GameStats.getTicketPerformance(gameId, filters),
    ]);

    return {
      name: summary.name || "",
      totalRevenue: parseFloat(summary.total_revenue || 0),
      totalBookings: parseInt(summary.total_bookings || 0),
      revenueTrend: trends.map((t) => ({
        date: t.period_start,
        revenue: parseFloat(t.revenue),
      })),
      bookingsTrend: trends.map((t) => ({
        date: t.period_start,
        bookings: parseInt(t.bookings),
      })),
      topPerformingTickets: ticketPerformance,
    };
  },
};

module.exports = { GameService, GameStatsService };
