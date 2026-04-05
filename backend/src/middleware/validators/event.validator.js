const { body } = require("../validate");

// ============================================
// EVENT VALIDATORS
// ============================================

const createEventRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Event name is required")
    .isLength({ max: 255 }),
  body("description").optional().trim(),
  body("eventDate")
    .isISO8601()
    .withMessage("Valid event date is required (YYYY-MM-DD)"),
  body("startTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
    .withMessage("Valid start time is required (HH:MM or HH:MM:SS)"),
  body("endTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
    .withMessage("Valid end time is required (HH:MM or HH:MM:SS)"),
  body("capacity")
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),
];

const createEventWithTicketTypesRules = [
  // Event validation rules
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Event name is required")
    .isLength({ max: 255 }),
  body("description").optional().trim(),
  body("eventDate")
    .isISO8601()
    .withMessage("Valid event date is required (YYYY-MM-DD)"),
  body("startTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
    .withMessage("Valid start time is required (HH:MM or HH:MM:SS)"),
  body("endTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
    .withMessage("Valid end time is required (HH:MM or HH:MM:SS)"),
  body("capacity")
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),

  // Ticket types validation
  body("ticketTypes")
    .isArray({ min: 1 })
    .withMessage("At least one ticket type is required"),
  body("ticketTypes.*.category")
    .isIn(["adult", "child", "senior", "student", "group"])
    .withMessage(
      "Category must be one of: adult, child, senior, student, group",
    ),
  body("ticketTypes.*.price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  body("ticketTypes.*.maxQuantityPerBooking")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Max quantity per booking must be between 1 and 50"),
];

const updateEventRules = [
  body("name").optional().trim().notEmpty().isLength({ max: 255 }),
  body("description").optional().trim(),
  body("eventDate").optional().isISO8601().withMessage("Valid date required"),
  body("startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body("endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body("capacity").optional().isInt({ min: 1 }),
  body("isActive").optional().isBoolean(),
];

module.exports = {
  createEventRules,
  createEventWithTicketTypesRules,
  updateEventRules,
};
