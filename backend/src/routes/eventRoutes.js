const express = require("express");
const router = express.Router();
const {
  EventController,
  EventStatsController,
} = require("../api/controllers/eventController");
const {
  uuidParamRule,
  paginationRules,
  handleValidation,
  analyticsRules,
} = require("../middleware/validate");

// Public routes - no auth required
router.get(
  "/",
  paginationRules,
  handleValidation,
  EventController.getActiveEvents,
);

router.get(
  "/stats",
  analyticsRules,
  handleValidation,
  EventStatsController.getEventStats,
);
router.get(
  "/stats/:eventId",
  uuidParamRule("eventId"),
  analyticsRules,
  handleValidation,
  EventStatsController.getEventDashboard,
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
