const { body, param, query: queryValidator } = require("express-validator");
const { validationResult } = require("express-validator");

/**
 * Process validation results and return errors if any
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// ============================================
// Query VALIDATORS
// ============================================

const paginationRules = [
  queryValidator("page").optional().isInt({ min: 1 }).toInt(),
  queryValidator("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

const analyticsRules = [
  queryValidator("period")
    .optional()
    .matches(/^[1-9][dwm]$/)
    .withMessage("Period must be a number (1-9) followed by 'd', 'w', or 'm'"),

  // Validates startDate is a proper ISO 8601 string
  queryValidator("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO8601 string")
    .toDate(),

  // Validates endDate is a proper ISO 8601 string
  queryValidator("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid ISO8601 string")
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error("endDate must be after startDate");
      }
      return true;
    }),
];

// ============================================
// PARAM VALIDATORS
// ============================================

const uuidParamRule = (paramName = "id") => [
  param(paramName).isUUID().withMessage(`Valid ${paramName} is required`),
];

const stringParamRule = (paramName, label = paramName) => [
  param(paramName)
    .isString()
    .withMessage(`${label} must be a string`)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required and cannot be empty`),
];

module.exports = {
  body,
  handleValidation,
  paginationRules,
  analyticsRules,
  uuidParamRule,
  stringParamRule,
};
