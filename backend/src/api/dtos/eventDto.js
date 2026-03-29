class EventRes {
  constructor(event) {
    this.id = event.id;
    this.productId = event.product_id;
    this.name = event.name;
    this.description = event.description;
    this.eventDate = event.event_date;
    this.startTime = event.start_time;
    this.endTime = event.end_time;
    this.capacity = event.capacity;
    this.ticketsSold = event.tickets_sold;
    this.availableTickets = event.available_tickets;
    this.isActive = event.is_active;
    this.ticketTypes = event.ticket_types;
    this.gallery = event.gallery;
  }
}

module.exports = { EventRes };
