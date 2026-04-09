const { body } = require("../validate");

// ============================================
// EVENT VALIDATORS
// ============================================
exports.eventRules = {
  create: [
    body("event").isObject().withMessage("Event data must be an object"),
    body("event.name")
      .trim()
      .notEmpty()
      .withMessage("Event name is required")
      .isLength({ max: 255 }),
    body("event.description").optional().trim(),
    body("event.eventDate")
      .notEmpty()
      .isISO8601()
      .withMessage("Valid event date is required (YYYY-MM-DD)"),
    body("event.startTime")
      .notEmpty()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
      .withMessage("Valid start time is required (HH:MM or HH:MM:SS)"),
    body("event.endTime")
      .notEmpty()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
      .withMessage("Valid end time is required (HH:MM or HH:MM:SS)"),
    body("event.capacity")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
    body("event.ticketTypes")
      .optional()
      .isArray({ min: 0 })
      .withMessage("At least one ticketType is required"),
    body("event.ticketTypes.*.price")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("event.ticketTypes.*.category")
      .notEmpty()
      .isIn(["ADULT", "CHILD", "STUDENT", "SENIOR", "GROUP"])
      .withMessage(
        "Category must be one of: ADULT, CHILD, STUDENT, SENIOR, GROUP",
      ),
    body("sessionId").isUUID().withMessage("Invalid session format"),
  ],

  update: [
    body("event").isObject().withMessage("Event data must be an object"),
    body("event.productId")
      .notEmpty()
      .isUUID()
      .withMessage("Invalid product ID"),
    body("event.name").optional().trim().notEmpty().isLength({ max: 255 }),
    body("event.description").optional().trim(),
    body("event.eventDate")
      .optional()
      .isISO8601()
      .withMessage("Valid date required"),
    body("event.startTime")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
      .withMessage("Valid start time is required (HH:MM or HH:MM:SS)"),
    body("event.endTime")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
      .withMessage("Valid start time is required (HH:MM or HH:MM:SS)"),
    body("event.capacity").optional().isInt({ min: 1 }),
    body("event.isActive").optional().isBoolean(),
    body("event.ticketTypes")
      .optional()
      .isArray({ min: 0 })
      .withMessage("At least one ticketType is required"),
    body("event.ticketTypes.*.id")
      .optional()
      .isUUID()
      .withMessage("invalid ticketType id"),
    body("event.ticketTypes.*.price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("event.ticketTypes.*.category")
      .optional()
      .isIn(["ADULT", "CHILD", "STUDENT", "SENIOR", "GROUP"])
      .withMessage(
        "Category must be one of: ADULT, CHILD, STUDENT, SENIOR, GROUP",
      ),
    body("sessionId").isUUID().withMessage("Invalid session format"),
  ],
};
