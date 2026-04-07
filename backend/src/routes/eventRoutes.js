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
const { eventRules } = require("../middleware/validators/event.validator");
const { eventLimiter } = require("../middleware/ratelimiting/event.limiter");

//===============
// SECURE ROUTES
//===============
router.post(
  "/add",
  eventLimiter.createLimit,
  isAuthenticated,
  isAdmin,
  eventRules.create,
  handleValidation,
  EventController.createEvent,
);
router.patch(
  "/patch/:id",
  eventLimiter.createLimit,
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  eventRules.update,
  handleValidation,
  EventController.updateEvent,
);
router.patch(
  "/status/:id",
  eventLimiter.writeLimit,
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  EventController.deactivateEvent,
);
router.delete(
  "/del/:id",
  eventLimiter.createLimit,
  isAuthenticated,
  isAdmin,
  uuidParamRule("id"),
  handleValidation,
  EventController.deleteEvent,
);
router.get(
  "/all",
  eventLimiter.getAllLimit,
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
  eventLimiter.statsLimit,
  isAuthenticated,
  isAdmin,
  analyticsRules,
  handleValidation,
  EventStatsController.getEventStats,
);
router.get(
  "/stats/:eventId",
  eventLimiter.statsLimit,
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
  eventLimiter.listLimit,
  paginationRules,
  handleValidation,
  EventController.getActiveEvents,
);
router.get(
  "/:id",
  eventLimiter.listLimit,
  uuidParamRule("id"),
  handleValidation,
  EventController.getEventById,
);
router.get(
  "/:id/availability",
  eventLimiter.listLimit,
  uuidParamRule("id"),
  handleValidation,
  EventController.checkAvailability,
);
router.get(
  "/:id/ticket-types",
  eventLimiter.listLimit,
  uuidParamRule("id"),
  handleValidation,
  EventController.getTicketTypes,
);

module.exports = router;
