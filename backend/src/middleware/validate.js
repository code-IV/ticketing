const { body, param, query: queryValidator } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Process validation results and return errors if any
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// ============================================
// AUTH VALIDATORS
// ============================================

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ max: 100 }).withMessage('First name must be at most 100 characters'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ max: 100 }).withMessage('Last name must be at most 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone').optional().trim()
    .matches(/^\+?[0-9]{7,15}$/).withMessage('Phone must be a valid number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty')
    .isLength({ max: 100 }),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty')
    .isLength({ max: 100 }),
  body('phone').optional().trim()
    .matches(/^\+?[0-9]{7,15}$/).withMessage('Phone must be a valid number'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ============================================
// EVENT VALIDATORS
// ============================================

const createEventRules = [
  body('name').trim().notEmpty().withMessage('Event name is required')
    .isLength({ max: 255 }),
  body('description').optional().trim(),
  body('eventDate').isISO8601().withMessage('Valid event date is required (YYYY-MM-DD)'),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/).withMessage('Valid start time is required (HH:MM or HH:MM:SS)'),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/).withMessage('Valid end time is required (HH:MM or HH:MM:SS)'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

const createEventWithTicketTypesRules = [
  // Event validation rules
  body('name').trim().notEmpty().withMessage('Event name is required')
    .isLength({ max: 255 }),
  body('description').optional().trim(),
  body('eventDate').isISO8601().withMessage('Valid event date is required (YYYY-MM-DD)'),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/).withMessage('Valid start time is required (HH:MM or HH:MM:SS)'),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/).withMessage('Valid end time is required (HH:MM or HH:MM:SS)'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  
  // Ticket types validation
  body('ticketTypes').isArray({ min: 1 }).withMessage('At least one ticket type is required'),
  body('ticketTypes.*.name').trim().notEmpty().withMessage('Ticket type name is required')
    .isLength({ max: 100 }),
  body('ticketTypes.*.category').isIn(['adult', 'child', 'senior', 'student', 'group'])
    .withMessage('Category must be one of: adult, child, senior, student, group'),
  body('ticketTypes.*.price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('ticketTypes.*.description').optional().trim(),
  body('ticketTypes.*.maxQuantityPerBooking').optional().isInt({ min: 1, max: 50 })
    .withMessage('Max quantity per booking must be between 1 and 50'),
];

const updateEventRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('eventDate').optional().isISO8601().withMessage('Valid date required'),
  body('startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('capacity').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
];

// ============================================
// TICKET TYPE VALIDATORS
// ============================================

const createTicketTypeRules = [
  body('eventId').isUUID().withMessage('Valid event ID is required'),
  body('name').trim().notEmpty().withMessage('Ticket type name is required')
    .isLength({ max: 100 }),
  body('category').isIn(['adult', 'child', 'senior', 'student', 'group'])
    .withMessage('Category must be one of: adult, child, senior, student, group'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('description').optional().trim(),
  body('maxQuantityPerBooking').optional().isInt({ min: 1, max: 50 }),
];

const updateTicketTypeRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('category').optional().isIn(['adult', 'child', 'senior', 'student', 'group']),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('maxQuantityPerBooking').optional().isInt({ min: 1, max: 50 }),
  body('isActive').optional().isBoolean(),
];

// ============================================
// BOOKING VALIDATORS
// ============================================

const createBookingRules = [
  body('eventId').isUUID().withMessage('Valid event ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one ticket item is required'),
  body('items.*.ticketTypeId').isUUID().withMessage('Valid ticket type ID is required'),
  body('items.*.quantity').isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'telebirr', 'cash'])
    .withMessage('Payment method must be one of: credit_card, debit_card, telebirr, cash'),
  body('guestEmail').optional().isEmail().withMessage('Valid guest email required'),
  body('guestName').optional().trim().isLength({ max: 200 }),
  body('notes').optional().trim(),
];

// ============================================
// PAGINATION VALIDATORS
// ============================================

const paginationRules = [
  queryValidator('page').optional().isInt({ min: 1 }).toInt(),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

// ============================================
// PARAM VALIDATORS
// ============================================

const uuidParamRule = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Valid ${paramName} is required`),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
  createEventRules,
  createEventWithTicketTypesRules,
  updateEventRules,
  createTicketTypeRules,
  updateTicketTypeRules,
  createBookingRules,
  paginationRules,
  uuidParamRule,
};
