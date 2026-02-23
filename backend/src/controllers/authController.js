const User = require('../models/User');
const { apiResponse } = require('../utils/helpers');

const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return apiResponse(res, 409, false, 'An account with this email already exists.');
      }

      const user = await User.create({ firstName, lastName, email, phone, password });

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      };

      return apiResponse(res, 201, true, 'Registration successful.', { user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return apiResponse(res, 401, false, 'Invalid email or password.');
      }

      if (!user.is_active) {
        return apiResponse(res, 403, false, 'Your account has been deactivated. Contact support.');
      }

      const isMatch = await User.comparePassword(password, user.password_hash);
      if (!isMatch) {
        return apiResponse(res, 401, false, 'Invalid email or password.');
      }

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      };

      return apiResponse(res, 200, true, 'Login successful.', {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return apiResponse(res, 500, false, 'Failed to log out.');
        }
        res.clearCookie('bora.sid');
        return apiResponse(res, 200, true, 'Logged out successfully.');
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      // Disable caching for auth endpoints
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
      
      const user = await User.findById(req.session.user.id);
      if (!user) {
        return apiResponse(res, 404, false, 'User not found.');
      }
      return apiResponse(res, 200, true, 'User retrieved.', { user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;
      const user = await User.update(req.session.user.id, { firstName, lastName, phone });

      if (!user) {
        return apiResponse(res, 404, false, 'User not found.');
      }

      // Update session data
      req.session.user.firstName = user.first_name;
      req.session.user.lastName = user.last_name;

      return apiResponse(res, 200, true, 'Profile updated successfully.', { user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByIdWithPassword(req.session.user.id);
      if (!user) {
        return apiResponse(res, 404, false, 'User not found.');
      }

      const isMatch = await User.comparePassword(currentPassword, user.password_hash);
      if (!isMatch) {
        return apiResponse(res, 400, false, 'Current password is incorrect.');
      }

      await User.updatePassword(user.id, newPassword);
      return apiResponse(res, 200, true, 'Password changed successfully.');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
