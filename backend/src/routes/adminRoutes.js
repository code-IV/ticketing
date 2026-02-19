const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const {
  createEventRules,
  updateEventRules,
  createTicketTypeRules,
  updateTicketTypeRules,
  uuidParamRule,
  paginationRules,
  handleValidation,
} = require('../middleware/validate');

// All admin routes require authentication + admin role
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Event management
router.get('/events', paginationRules, handleValidation, adminController.getAllEvents);
router.post('/events', createEventRules, handleValidation, adminController.createEvent);
router.put('/events/:id', uuidParamRule('id'), updateEventRules, handleValidation, adminController.updateEvent);
router.delete('/events/:id', uuidParamRule('id'), handleValidation, adminController.deleteEvent);

// Ticket type management
router.post('/ticket-types', createTicketTypeRules, handleValidation, adminController.createTicketType);
router.put('/ticket-types/:id', uuidParamRule('id'), updateTicketTypeRules, handleValidation, adminController.updateTicketType);
router.delete('/ticket-types/:id', uuidParamRule('id'), handleValidation, adminController.deleteTicketType);

// Booking management
router.get('/bookings', paginationRules, handleValidation, adminController.getAllBookings);
router.get('/bookings/:id', uuidParamRule('id'), handleValidation, adminController.getBookingDetails);
router.post('/bookings/:id/cancel', uuidParamRule('id'), handleValidation, adminController.cancelBooking);

// User management
router.get('/users', paginationRules, handleValidation, adminController.getAllUsers);
router.get('/users/:id', uuidParamRule('id'), handleValidation, adminController.getUserById);
router.patch('/users/:id/toggle-active', uuidParamRule('id'), handleValidation, adminController.toggleUserActive);

// Reports
router.get('/reports/revenue', adminController.getRevenueSummary);
router.get('/reports/daily-revenue', adminController.getDailyRevenue);
router.get('/reports/payments', paginationRules, handleValidation, adminController.getAllPayments);

module.exports = router;
