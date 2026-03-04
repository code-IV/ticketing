const express = require("express");
const router = express.Router();
const {
  eventController,
  eventStatsController,
} = require("../api/controllers/eventController");
const {
  uuidParamRule,
  paginationRules,
  handleValidation,
} = require("../middleware/validate");

// Public routes - no auth required
router.get(
  "/",
  paginationRules,
  handleValidation,
  eventController.getActiveEvents,
);
router.get("/stats", eventStatsController.getEventStats);
router.get(
  "/stats/:eventId",
  uuidParamRule("eventId"),
  eventStatsController.getEventDashboard,
);
router.get(
  "/:id",
  uuidParamRule("id"),
  handleValidation,
  eventController.getEventById,
);
router.get(
  "/:id/availability",
  uuidParamRule("id"),
  handleValidation,
  eventController.checkAvailability,
);
router.get(
  "/:id/ticket-types",
  uuidParamRule("id"),
  handleValidation,
  eventController.getTicketTypes,
);

module.exports = router;
