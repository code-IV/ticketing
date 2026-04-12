class CreateBookingEventsReq {
  constructor(data) {
    ((this.eventId = data.eventId), (this.paymentMethod = data.paymentMethod));
    this.items = data.items.map((item) => ({
      ticketTypeId: item.ticketTypeId,
      promotionId: item.promotionId ?? null,
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
      promotionId: item.promotionId ?? null,
      quantity: item.quantity,
    }));
  }
}

class PunchTicetReq {
  constructor(usage) {
    this.usage = usage.map((item) => ({
      passId: item.gameId,
      quantity: item.quantity,
    }));
  }
}

module.exports = {
  CreateBookingEventsReq,
  CreateBookingGamesReq,
  PunchTicetReq,
};
