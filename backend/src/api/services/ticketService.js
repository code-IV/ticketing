const { getClient, pool } = require("../../config/db");
const Ticket = require("../models/Ticket");

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

  async punchPass(usageArray) {
    // Renamed parameter for clarity
    const client = await getClient();
    try {
      await client.query("BEGIN");
      const results = [];

      for (const item of usageArray) {
        // 1. Lock the row for this specific passId
        const pass = await Ticket.findAndLock(client, item.passId);

        // 2. Existence Check
        if (!pass) {
          await client.query("ROLLBACK");
          return { success: false, error: "PASS_NOT_FOUND", id: item.passId };
        }

        // 3. Status Check (e.g., must be 'AVAILABLE')
        if (pass.status !== "AVAILABLE") {
          await client.query("ROLLBACK");
          return { success: false, error: "PASS_NOT_ACTIVE", id: item.passId };
        }

        // 4. Quantity Check
        const newUsedTotal = pass.used_quantity + item.quantity;
        if (newUsedTotal > pass.total_quantity) {
          await client.query("ROLLBACK");
          return {
            success: false,
            error: "INSUFFICIENT_QUANTITY",
            id: item.passId,
          };
        }

        // 5. Increment Usage
        // Note: If newUsedTotal === total_quantity, you might want to update status to 'USED'
        const updatedPass = await Ticket.incrementUsage(
          client,
          item.passId,
          item.quantity,
        );

        results.push(updatedPass);
      }

      await client.query("COMMIT");
      return { success: true, data: results };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Punch Error:", err);
      return { success: false, error: "SERVER_ERROR" };
    } finally {
      client.release();
    }
  },
};
module.exports = TicketService;
