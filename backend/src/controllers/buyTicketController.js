const { query, getClient } = require("../config/db");
const { apiResponse } = require("../utils/helpers");

const buyTicketController = {
  /**
   * GET /api/buy/games/:id - Get single game details with ticket types
   */
  async getGameById(req, res, next) {
    try {
      const { id } = req.params;
      
      // Query game with its ticket types
      const sql = `
        SELECT 
          g.id,
          g.name,
          g.description,
          g.rules,
          g.status,
          g.created_at,
          g.updated_at,
          tt.id as ticket_type_id,
          tt.name as ticket_type_name,
          tt.category,
          tt.price,
          tt.description as ticket_description,
          tt.is_active
        FROM games g
        LEFT JOIN ticket_types tt ON g.id = tt.game_id AND tt.is_active = true
        WHERE g.id = $1 AND g.status = 'OPEN'
        ORDER BY tt.price
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return apiResponse(res, 404, false, "Game not found or not available");
      }
      
      // Group ticket types by game
      const game = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        rules: result.rows[0].rules,
        status: result.rows[0].status,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
        ticket_types: []
      };
      
      result.rows.forEach(row => {
        if (row.ticket_type_id) {
          game.ticket_types.push({
            id: row.ticket_type_id,
            name: row.ticket_type_name,
            category: row.category,
            price: parseFloat(row.price),
            description: row.ticket_description,
            is_active: row.is_active
          });
        }
      });
      
      return apiResponse(res, 200, true, "Game retrieved successfully", { game });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/buy/games - Get all open games with their ticket prices
   */
  async getOpenGames(req, res, next) {
    try {
      // Query games with their ticket types
      const sql = `
        SELECT DISTINCT
          g.id,
          g.name,
          g.description,
          g.rules,
          g.status,
          g.created_at,
          g.updated_at,
          tt.id as ticket_type_id,
          tt.name as ticket_type_name,
          tt.category,
          tt.price,
          tt.description as ticket_description,
          tt.is_active
        FROM games g
        LEFT JOIN ticket_types tt ON g.id = tt.game_id AND tt.is_active = true
        WHERE g.status = 'OPEN' 
        ORDER BY g.created_at DESC, tt.price
      `;
      
      const result = await query(sql);
      
      // Group results by game
      const gamesMap = new Map();
      
      result.rows.forEach(row => {
        if (!gamesMap.has(row.id)) {
          gamesMap.set(row.id, {
            id: row.id,
            name: row.name,
            description: row.description,
            rules: row.rules,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            ticket_types: []
          });
        }
        
        const game = gamesMap.get(row.id);
        if (row.ticket_type_id) {
          game.ticket_types.push({
            id: row.ticket_type_id,
            name: row.ticket_type_name,
            category: row.category,
            price: parseFloat(row.price), // Convert to number
            description: row.ticket_description,
            is_active: row.is_active
          });
        }
      });
      
      const games = Array.from(gamesMap.values());
      return apiResponse(res, 200, true, "Open games retrieved successfully", games);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/buy/purchase - Purchase tickets for games
   * Body: { game_id: string, quantity: number }
   */
  async purchaseTickets(req, res, next) {
    try {
      const { game_id, quantity, ticket_type_id } = req.body;
      const userId = req.session.user.id;

      const client = await getClient();
      try {
        await client.query("BEGIN");

        // 1. Verify game exists and is open, get ticket type info
        let gameCheckSql;
        let queryParams;
        
        if (ticket_type_id) {
          // If specific ticket type is provided
          gameCheckSql = `
            SELECT 
              g.id, 
              g.name, 
              g.status,
              tt.id as ticket_type_id,
              tt.name as ticket_type_name,
              tt.price,
              tt.category
            FROM games g
            LEFT JOIN ticket_types tt ON g.id = tt.game_id AND tt.is_active = true
            WHERE g.id = $1 AND g.status = 'OPEN' AND tt.id = $2
            LIMIT 1
          `;
          queryParams = [game_id, ticket_type_id];
        } else {
          // If no specific ticket type, get the first active one
          gameCheckSql = `
            SELECT 
              g.id, 
              g.name, 
              g.status,
              tt.id as ticket_type_id,
              tt.name as ticket_type_name,
              tt.price,
              tt.category
            FROM games g
            LEFT JOIN ticket_types tt ON g.id = tt.game_id AND tt.is_active = true
            WHERE g.id = $1 AND g.status = 'OPEN'
            LIMIT 1
          `;
          queryParams = [game_id];
        }
        
        const gameResult = await client.query(gameCheckSql, queryParams);
        
        if (gameResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return apiResponse(res, 404, false, "Game not found or not available for purchase");
        }

        const game = gameResult.rows[0];
        if (!game.ticket_type_id) {
          await client.query("ROLLBACK");
          return apiResponse(res, 400, false, "No ticket type available for this game");
        }

        const totalPrice = parseFloat(game.price) * quantity;

        // 2. Create ticket entry
        const ticketSql = `
          INSERT INTO tickets (
            booking_id,
            ticket_code,
            qr_token,
            status,
            purchased_at,
            expires_at,
            total_price,
            payment_reference,
            buyer_contact
          )
          VALUES (
            $1, $2, $3, $4, NOW(), NOW() + INTERVAL '24 hours', $5, $6, $7
          )
          RETURNING *
        `;

        // Generate a simple ticket code and QR token
        const ticketCode = `TCK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const qrToken = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const paymentReference = `PAY-${Date.now()}`;
        const buyerContact = req.session.user.email;

        const ticketValues = [
          null, // booking_id (can be null for direct game purchases)
          ticketCode,
          qrToken,
          'ACTIVE',
          totalPrice,
          paymentReference,
          buyerContact
        ];

        const ticketResult = await client.query(ticketSql, ticketValues);
        const newTicket = ticketResult.rows[0];

        // 3. Create ticket_games junction entry
        const ticketGameSql = `
          INSERT INTO ticket_games (ticket_id, game_id, status)
          VALUES ($1, $2, 'AVAILABLE')
          RETURNING *
        `;
        
        const ticketGameResult = await client.query(ticketGameSql, [
          newTicket.id,
          game_id
        ]);

        await client.query("COMMIT");

        const responseData = {
          ticket: newTicket,
          game: {
            id: game.id,
            name: game.name,
            status: game.status
          },
          ticket_type: {
            id: game.ticket_type_id,
            name: game.ticket_type_name,
            category: game.category,
            price: game.price
          },
          ticket_game: ticketGameResult.rows[0],
          quantity: quantity,
          total_price: totalPrice
        };

        return apiResponse(res, 201, true, "Ticket purchase successful", responseData);

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (err) {
      next(err);
    }
  },
};

module.exports = buyTicketController;
