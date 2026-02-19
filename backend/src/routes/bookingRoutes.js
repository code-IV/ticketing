const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated } = require('../middleware/auth');
const {
  createBookingRules,
  uuidParamRule,
  paginationRules,
  handleValidation,
} = require('../middleware/validate');

// All booking routes require authentication
router.use(isAuthenticated);

router.post('/', createBookingRules, handleValidation, bookingController.createBooking);
router.get('/my', paginationRules, handleValidation, bookingController.getMyBookings);
router.get('/reference/:reference', bookingController.getBookingByReference);
router.get('/:id', uuidParamRule('id'), handleValidation, bookingController.getBookingById);
router.post('/:id/cancel', uuidParamRule('id'), handleValidation, bookingController.cancelBooking);
router.get('/:id/tickets', uuidParamRule('id'), handleValidation, bookingController.getBookingTickets);

module.exports = router;
