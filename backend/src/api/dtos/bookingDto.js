class CreateBookingEventsReq {
  constructor(data) {
    ((this.eventId = data.eventId), (this.paymentMethod = data.paymentMethod));
    this.items = data.items.map((item) => ({
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
    }));
  }
}

class CreateBookingGamesReq {
  constructor(data) {
    this.paymentMethod = data.paymentMethod;
    this.items = data.items.map((item) => ({
      gameId: item.gameId,
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
    }));
  }
}

module.exports = { CreateBookingEventsReq, CreateBookingGamesReq };
