const { body } = require("../validate");

exports.gameRules = {
  create: [
    body("game").isObject().withMessage("Gamet data must be an object"),
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Game name is required")
      .isLength({ max: 255 }),
    body("game.description").optional().trim(),
    body("game.rules").optional().trim(),
    body("game.status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["OPEN", "ON_MAINTENANCE", "UPCOMING", "CLOSED"])
      .withMessage("invalid status"),
    body("game.ticketTypes")
      .optional()
      .isArray({ min: 0 })
      .withMessage("At least one ticketType is required"),
    body("game.ticketTypes.*.price")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("game.ticketTypes.*.category")
      .notEmpty()
      .isIn(["ADULT", "CHILD", "STUDENT", "SENIOR", "GROUP"])
      .withMessage(
        "Category must be one of: ADULT, CHILD, STUDENT, SENIOR, GROUP",
      ),
    body("sessionId").isUUID().withMessage("Invalid session format"),
  ],

  update: [
    body("game").isObject().withMessage("Gamet data must be an object"),
    body("game.productId")
      .notEmpty()
      .isUUID()
      .withMessage("Invalid product ID"),
    body("game.name").trim().optional().isLength({ max: 255 }),
    body("game.description").optional().trim(),
    body("game.rules").optional().trim(),
    body("game.status")
      .optional()
      .isIn(["OPEN", "ON_MAINTENANCE", "UPCOMING", "CLOSED"])
      .withMessage("invalid status"),
    body("game.ticketTypes")
      .optional()
      .isArray({ min: 0 })
      .withMessage("At least one ticketType is required"),
    body("game.ticketTypes.*.id")
      .optional()
      .isUUID()
      .withMessage("Ticket type ID must be a valid UUID"),
    body("game.ticketTypes.*.price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("game.ticketTypes.*.category")
      .optional()
      .isIn(["ADULT", "CHILD", "STUDENT", "SENIOR", "GROUP"])
      .withMessage(
        "Category must be one of: ADULT, CHILD, STUDENT, SENIOR, GROUP",
      ),
    body("sessionId").isUUID().withMessage("Invalid session format"),
  ],
};
