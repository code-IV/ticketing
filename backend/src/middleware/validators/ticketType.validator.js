const { body } = require("../validate");
// ============================================
// TICKET TYPE VALIDATORS
// ============================================

const createTicketTypeRules = [
  body("eventId").isUUID().withMessage("Valid event ID is required"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Ticket type name is required")
    .isLength({ max: 100 }),
  body("category")
    .isIn(["adult", "child", "senior", "student", "group"])
    .withMessage(
      "Category must be one of: adult, child, senior, student, group",
    ),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  body("description").optional().trim(),
  body("maxQuantityPerBooking").optional().isInt({ min: 1, max: 50 }),
];

const updateTicketTypeRules = [
  body("name").optional().trim().notEmpty().isLength({ max: 100 }),
  body("category")
    .optional()
    .isIn(["adult", "child", "senior", "student", "group"]),
  body("price").optional().isFloat({ min: 0 }),
  body("description").optional().trim(),
  body("maxQuantityPerBooking").optional().isInt({ min: 1, max: 50 }),
  body("isActive").optional().isBoolean(),
];

module.exports = { createTicketTypeRules, updateTicketTypeRules };
