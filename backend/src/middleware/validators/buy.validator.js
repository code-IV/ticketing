const { body } = require("../validate");
const { query: queryValidator } = require("express-validator");
// ============================================
// BUY TICKET VALIDATORS
// ============================================

const purchaseTicketRules = [
  body("game_id").isUUID().withMessage("Valid game ID is required"),
  body("quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be between 1 and 50"),
  body("ticket_type_id")
    .optional()
    .isUUID()
    .withMessage("Valid ticket type ID is required"),
];

const scanTicketRules = [
  queryValidator("token")
    .notEmpty()
    .withMessage("Token is required")
    // We avoid .isUUID() because HMAC is a custom string format
    .isString()
    .withMessage("Token must be a valid string"),
];

module.exports = { purchaseTicketRules, scanTicketRules };
