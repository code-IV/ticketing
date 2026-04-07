const express = require("express");
const router = express.Router();
const {
  EventController,
  EventStatsController,
} = require("../api/controllers/eventController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const {
  uuidParamRule,
  paginationRules,
  handleValidation,
  analyticsRules,
} = require("../middleware/validate");
const {
  createEventRules,
  updateEventRules,
  createEventWithTicketTypesRules,
} = require("../middleware/validators/event.validator");

//===============
// SECURE ROUTES
//===============
router.post(
  "/add",
  isAuthenticated,
  isAdmin,
  createEventRules,
  handleValidation,
  EventController.createEvent,
);
router.patch(
  "/patch/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  EventController.updateEvent,
);
router.patch(
  "/status/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  EventController.deactivateEvent,
);
router.delete(
  "/del/:id",
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  EventController.deleteEvent,
);
router.get(
  "/all",
  isAuthenticated,
  isAdmin,
  paginationRules,
  handleValidation,
  EventController.getAllEvents,
);

//===============
// Analytics ROUTES
//===============

router.get(
  "/stats",
  isAuthenticated,
  isAdmin,
  analyticsRules,
  handleValidation,
  EventStatsController.getEventStats,
);
router.get(
  "/stats/:eventId",
  isAuthenticated,
  isAdmin,
  uuidParamRule("eventId"),
  analyticsRules,
  handleValidation,
  EventStatsController.getEventDashboard,
);

//===============
// PUBlIC ROUTES
//===============

router.get(
  "/",
  paginationRules,
  handleValidation,
  EventController.getActiveEvents,
);
router.get(
  "/:id",
  uuidParamRule("id"),
  handleValidation,
  EventController.getEventById,
);
router.get(
  "/:id/availability",
  uuidParamRule("id"),
  handleValidation,
  EventController.checkAvailability,
);
router.get(
  "/:id/ticket-types",
  uuidParamRule("id"),
  handleValidation,
  EventController.getTicketTypes,
);

module.exports = router;
