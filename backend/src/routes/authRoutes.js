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

router.get("/google/login", userLimiter.authLimiter, (req, res) => {
  const { returnTo } = req.query;
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${process.env.BACKEND_URL}/api/auth/google/callback&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `state=${returnTo}`;

  res.redirect(googleAuthUrl);
});

router.get(
  "/google/callback",
  userLimiter.authLimiter,
  authController.googleAuth,
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
