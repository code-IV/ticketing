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
// PAGINATION VALIDATORS
// ============================================

const paginationRules = [
  queryValidator("page").optional().isInt({ min: 1 }).toInt(),
  queryValidator("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
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
  uuidParamRule,
  stringParamRule,
};
