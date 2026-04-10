const { body } = require("../validate");
const { query: queryValidator } = require("express-validator");
// ============================================
// BUY TICKET VALIDATORS
// ============================================

exports.ticketRules = {
  punch: [
    body("usage")
      .notEmpty()
      .withMessage("usage is required")
      .isArray()
      .withMessage("usage must be a valid object"),
    body("usage.*.passId")
      .notEmpty()
      .withMessage("passId is required")
      .isUUID()
      .withMessage("passId must be a valid UUId"),
    body("usage.*.quantity")
      .notEmpty()
      .withMessage("quantity is required")
      .isInt({ min: 0 })
      .withMessage("Token must be a valid int"),
  ],
  scan: [
    queryValidator("token")
      .notEmpty()
      .withMessage("Token is required")
      // We avoid .isUUID() because HMAC is a custom string format
      .isString()
      .withMessage("Token must be a valid string"),
  ],
  purchaseTicketRules: [
    body("game_id").isUUID().withMessage("Valid game ID is required"),
    body("quantity")
      .isInt({ min: 1, max: 50 })
      .withMessage("Quantity must be between 1 and 50"),
    body("ticket_type_id")
      .optional()
      .isUUID()
      .withMessage("Valid ticket type ID is required"),
  ],
};
