const { body } = require("../validate");
// ============================================
// BOOKING VALIDATORS
// ============================================
exports.bookingValidator = {
  createEventBookingRules: [
    body("eventId")
      .notEmpty()
      .isUUID()
      .withMessage("Valid event ID is required"),
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
  ],

  createGameBookingRules: [
    body("items")
      .isArray({ min: 1 })
      .withMessage("At least one ticket item is required"),
    body("items.*.gameId")
      .notEmpty()
      .isUUID()
      .withMessage("Each item must have a valid game ID"),
    body("items.*.ticketTypeId")
      .notEmpty()
      .isUUID()
      .withMessage("Ticket type ID is required"),
    body("items.*.category")
      .trim()
      .notEmpty()
      .isLength({ max: 100 })
      .withMessage("Category is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("paymentMethod")
      .isIn(["credit_card", "debit_card", "telebirr", "cash"])
      .withMessage(
        "Payment method must be one of: credit_card, debit_card, telebirr, cash",
      ),
  ],
};
