const { body } = require("../validate");
// ============================================
// BOOKING VALIDATORS
// ============================================

const createBookingRules = [
  body("eventId").isUUID().withMessage("Valid event ID is required"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one ticket item is required"),
  body("items.*.ticketTypeId")
    .isUUID()
    .withMessage("Valid ticket type ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be between 1 and 50"),
  body("paymentMethod")
    .isIn(["credit_card", "debit_card", "telebirr", "cash"])
    .withMessage(
      "Payment method must be one of: credit_card, debit_card, telebirr, cash",
    ),
  body("guestEmail")
    .optional()
    .isEmail()
    .withMessage("Valid guest email required"),
  body("guestName").optional().trim().isLength({ max: 200 }),
  body("notes").optional().trim(),
];

module.exports = { createBookingRules };
