const express = require("express");
const router = express.Router();
const authController = require("../api/controllers/authController");
const { userLimiter } = require("../middleware/ratelimiting/user.limiter");
const { isAuthenticated } = require("../middleware/auth");
const { handleValidation } = require("../middleware/validate");
const {
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
} = require("../middleware/validators/auth.validator");

// Public routes
router.post(
  "/register",
  userLimiter.authLimiter,
  registerRules,
  handleValidation,
  authController.register,
);
router.post(
  "/login",
  userLimiter.authLimiter,
  loginRules,
  handleValidation,
  authController.login,
);

// Protected routes
router.put(
  "/change-password",
  userLimiter.authLimiter,
  isAuthenticated,
  changePasswordRules,
  handleValidation,
  authController.changePassword,
);
router.get(
  "/me",
  userLimiter.getUserLimiter,
  isAuthenticated,
  authController.getMe,
);
router.put(
  "/profile",
  userLimiter.getUserLimiter,
  isAuthenticated,
  updateProfileRules,
  handleValidation,
  authController.updateProfile,
);
router.post(
  "/logout",
  userLimiter.getUserLimiter,
  isAuthenticated,
  authController.logout,
);

module.exports = router;
