const { getClient, pool } = require("../../config/db");
const { Ticket } = require("../models/Ticket");

const TicketService = {
  async scan(qrToken) {
    // For simple reads, you can use pool.query directly
    const ticket = await Ticket.findByQrToken(pool, qrToken);

    if (!ticket) return { success: false, error: "NOT_FOUND" };

    // Fix: Your migration uses 'ACTIVE' for ticket status and 'CONFIRMED' for booking
    if (ticket.status !== "ACTIVE" || ticket.booking_status !== "CONFIRMED") {
      return { success: false, error: "TICKET_NOT_VALID" };
    }

    const isExpired = new Date(ticket.expires_at) < new Date();
    if (isExpired) return { success: false, error: "EXPIRED" };

    const passes = await Ticket.getPasses(pool, ticket.id);

    return {
      success: true,
      data: { ticket, passes },
    };
  },

  async punchPass(ticketId, productId) {
    const client = await getClient(); // Get a dedicated client for the transaction
    try {
      await client.query("BEGIN");

      // Pass the 'client' to the model so the LOCK (FOR UPDATE) works!
      const pass = await Ticket.findAndLock(client, ticketId, productId);

      if (!pass) {
        await client.query("ROLLBACK");
        return { success: false, error: "PASS_NOT_FOUND" };
      }

      if (pass.used_quantity >= pass.total_quantity) {
        await client.query("ROLLBACK");
        return { success: false, error: "NO_REMAINING_USES" };
      }

      const updatedPass = await Ticket.incrementUsage(
        client,
        ticketId,
        productId,
      );

      await client.query("COMMIT");
      return { success: true, data: updatedPass };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Punch Error:", err);
      return { success: false, error: "SERVER_ERROR" };
    } finally {
      client.release(); // CRITICAL: Frees the connection back to the pool
    }
  },
};
module.exports = TicketService;
