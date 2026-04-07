const { body } = require("../validate");

exports.gameRules = {
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Game name is required")
      .isLength({ max: 255 }),
    body("description").optional().trim(),
    body("rules").optional().trim(),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["OPEN", "ON_MAINTENANCE", "UPCOMING", "CLOSED"])
      .withMessage("invalid status"),
    body("ticketTypes")
      .optional()
      .isArray({ min: 0 })
      .withMessage("At least one ticketType is required"),
    body("ticketTypes.*.price")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("ticketTypes.*.category")
      .notEmpty()
      .isIn(["ADULT", "CHILD", "STUDENT", "SENIOR", "GROUP"])
      .withMessage(
        "Category must be one of: ADULT, CHILD, STUDENT, SENIOR, GROUP",
      ),
  ],

  update: [
    body("productId").notEmpty().isUUID().withMessage("Invalid product ID"),
    body("name").trim().optional().isLength({ max: 255 }),
    body("description").optional().trim(),
    body("rules").optional().trim(),
    body("status")
      .optional()
      .isIn(["OPEN", "ON_MAINTENANCE", "UPCOMING", "CLOSED"])
      .withMessage("invalid status"),
    body("ticketTypes")
      .optional()
      .isArray({ min: 0 })
      .withMessage("At least one ticketType is required"),
    body("ticketTypes.*.id")
      .optional()
      .isUUID()
      .withMessage("Ticket type ID must be a valid UUID"),
    body("ticketTypes.*.price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("ticketTypes.*.category")
      .optional()
      .isIn(["ADULT", "CHILD", "STUDENT", "SENIOR", "GROUP"])
      .withMessage(
        "Category must be one of: ADULT, CHILD, STUDENT, SENIOR, GROUP",
      ),
  ],
};
