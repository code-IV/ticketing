class ActiveEvents {
  constructor(event) {
    this.id = event.id;
    this.name = event.name;
    this.description = event.description;
    this.eventDate = event.event_date;
    this.startTime = event.start_time;
    this.endTime = event.endTime;
    this.capacity = event.capacity;
    this.ticketsSold = event.tickets_sold;
    this.availableTickets = event.available_tickets;
    this.isActive = event.is_Active;
    this.ticketTypes = event.ticket_types;
    this.gallery = event.gallery;
  }
}

module.exports = { ActiveEvents };
