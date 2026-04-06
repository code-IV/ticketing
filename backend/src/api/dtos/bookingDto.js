const TicketType = require("../models/TicketType");

class createBookingGamesReq {
  constructor(data) {
    this.paymentMethod = data.paymentMethod;
    this.items = data.items.map((item) => ({
      gameId: item.gameId,
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
    }));
  }
}

module.exports = { createBookingGamesReq };
