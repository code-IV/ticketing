const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { uuidParamRule, paginationRules, handleValidation } = require('../middleware/validate');

// Public routes - no auth required
router.get('/', paginationRules, handleValidation, eventController.getActiveEvents);
router.get('/:id', uuidParamRule('id'), handleValidation, eventController.getEventById);
router.get('/:id/availability', uuidParamRule('id'), handleValidation, eventController.checkAvailability);
router.get('/:id/ticket-types', uuidParamRule('id'), handleValidation, eventController.getTicketTypes);

module.exports = router;
