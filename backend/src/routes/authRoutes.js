const express = require("express");
const router = express.Router();
const authController = require("../api/controllers/authController");
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
  registerRules,
  handleValidation,
  authController.register,
);
router.post("/login", loginRules, handleValidation, authController.login);

// Protected routes
router.post("/logout", isAuthenticated, authController.logout);
router.get("/me", isAuthenticated, authController.getMe);
router.put(
  "/profile",
  isAuthenticated,
  updateProfileRules,
  handleValidation,
  authController.updateProfile,
);
router.put(
  "/change-password",
  isAuthenticated,
  changePasswordRules,
  handleValidation,
  authController.changePassword,
);

module.exports = router;
