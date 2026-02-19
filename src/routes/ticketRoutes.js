const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { uuidParamRule, handleValidation } = require('../middleware/validate');

// Authenticated routes
router.get('/:id', isAuthenticated, uuidParamRule('id'), handleValidation, ticketController.getTicketById);
router.get('/code/:code', isAuthenticated, ticketController.getTicketByCode);

// Admin only - validate ticket at gate
router.post('/validate/:code', isAuthenticated, isAdmin, ticketController.validateTicket);

module.exports = router;
