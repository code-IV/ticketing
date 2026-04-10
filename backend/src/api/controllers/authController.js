const User = require("../models/User");
const { apiResponse } = require("../../utils/helpers");
const { UserService } = require("../services/userService");

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
        return apiResponse(
          res,
          409,
          false,
          "An account with this email already exists.",
        );
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
      });

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        firstName: user.first_name,
        lastName: user.last_name,
      };

      return apiResponse(res, 201, true, "Registration successful.", {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
        },
      });
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
        return apiResponse(res, 401, false, "Invalid email or password.");
      }

      if (!user.is_active) {
        return apiResponse(
          res,
          403,
          false,
          "Your account has been deactivated. Contact support.",
        );
      }

      const isMatch = await User.comparePassword(password, user.password_hash);
      if (!isMatch) {
        return apiResponse(res, 401, false, "Invalid email or password.");
      }

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        firstName: user.first_name,
        lastName: user.last_name,
      };

      return apiResponse(res, 200, true, "Login successful.", {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/google/callback
   */
  async googleAuth(req, res, next) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res
          .status(400)
          .json({ message: "No code provided from Google" });
      }

      // 1. Exchange the code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokens.error_description || "Failed to exchange code");
      }

      const { access_token } = tokens;

      // 2. Fetch User Profile using the access_token
      const userResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      const googleUser = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(
          googleUser.error?.message || "Failed to fetch user info",
        );
      }

      if (!googleUser.sub || !googleUser.email) {
        throw new Error("Incomplete user profile from Google");
      }

      // Now you have: googleUser.email, googleUser.sub (ID), googleUser.name, googleUser.picture
      // 3. Database Logic (Example)
      const user = await UserService.authUser("google", {
        authId: googleUser.sub,
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
      });
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        firstName: user.first_name,
        lastName: user.last_name,
      };
      console.log("session:   ", req.session.user);

      req.session.save((err) => {
        if (err) {
          console.error("SESSION SAVE ERROR:", err);
          return res.status(500).send("Internal Server Error");
        }
        console.log("Session saved successfully for user:", user.email);
        const destination = state || `${process.env.CLIENT_URL}/`;
        res.redirect(destination);
      });
    } catch (error) {
      console.error("OAuth Error:", error);
      res.redirect(`${process.env.CLIENT_URL}/`);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return apiResponse(res, 500, false, "Failed to log out.");
        }
        res.clearCookie("bora.sid");
        return apiResponse(res, 200, true, "Logged out successfully.");
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
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("ETag", ""); // Clear ETag to prevent 304 responses
      console.log("me  ", req.session.user);

      const user = await User.findById(req.session.user.id);
      if (!user) {
        return apiResponse(res, 404, false, "User not found.");
      }
      return apiResponse(res, 200, true, "User retrieved.", {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
        },
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;
      const user = await User.update(req.session.user.id, {
        firstName,
        lastName,
        phone,
      });

      if (!user) {
        return apiResponse(res, 404, false, "User not found.");
      }

      // Update session data
      req.session.user.firstName = user.first_name;
      req.session.user.lastName = user.last_name;

      return apiResponse(res, 200, true, "Profile updated successfully.", {
        user,
      });
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
        return apiResponse(res, 404, false, "User not found.");
      }

      const isMatch = await User.comparePassword(
        currentPassword,
        user.password_hash,
      );
      if (!isMatch) {
        return apiResponse(res, 400, false, "Current password is incorrect.");
      }

      await User.updatePassword(user.id, newPassword);
      return apiResponse(res, 200, true, "Password changed successfully.");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
