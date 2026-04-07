class CreateEventReq {
  constructor(event) {
    this.name = event.name;
    this.description = event.description;
    this.eventDate = event.eventDate;
    this.startTime = event.startTime;
    this.endTime = event.endTime;
    this.capacity = event.capacity;
    this.ticketTypes = (event.ticketTypes || []).map((type) => ({
      price: type.price,
      category: type.category,
    }));
    this.mediaIds = event.mediaIds || [];
  }
}

class UpdateEventReq {
  constructor(event) {
    this.name = event.name;
    this.description = event.description;
    this.eventDate = event.eventDate;
    this.startTime = event.startTime;
    this.endTime = event.endTime;
    this.capacity = event.capacity;
    this.ticketTypes = (event.ticketTypes || []).map((type) => ({
      id: type.id || null,
      price: type.price,
      category: type.category,
    }));
    this.mediaIds = event.mediaIds || [];
  }
}

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

module.exports = { CreateEventReq, UpdateEventReq, EventRes };
