const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const {
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
  handleValidation,
} = require('../middleware/validate');

// Public routes
router.post('/register', registerRules, handleValidation, authController.register);
router.post('/login', loginRules, handleValidation, authController.login);

// Protected routes
router.post('/logout', isAuthenticated, authController.logout);
router.get('/me', isAuthenticated, authController.getMe);
router.put('/profile', isAuthenticated, updateProfileRules, handleValidation, authController.updateProfile);
router.put('/change-password', isAuthenticated, changePasswordRules, handleValidation, authController.changePassword);

module.exports = router;
