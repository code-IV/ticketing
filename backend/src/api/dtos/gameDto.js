class GameRes {
  constructor(game) {
    this.id = game.id;
    this.productId = game.product_id;
    this.name = game.name;
    this.description = game.description;
    this.rules = game.rules;
    this.status = game.status;
    this.ticketTypes = game.ticket_types;
    this.category = game.category;
    this.capacity = game.capacity;
    this.createdAt = game.created_at;
    this.updatedAt = game.updated_at;
    this.gallery = game.gallery;
  }
}

module.exports = { GameRes };
