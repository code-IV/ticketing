const { apiResponse } = require("../utils/helpers");

/**
 * Check if user is authenticated (has active session)
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return apiResponse(
    res,
    401,
    false,
    "Authentication required. Please log in.",
  );
};

/**
 * Check if user is an admin
 */
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === "ADMIN") {
    return next();
  }
  return apiResponse(
    res,
    403,
    false,
    "Access denied. Admin privileges required.",
  );
};

/**
 * Check if user owns the resource or is admin
 */
const isOwnerOrAdmin = (paramName = "userId") => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return apiResponse(res, 401, false, "Authentication required.");
    }
    const resourceUserId = req.params[paramName];
    const sessionUser = req.session.user;

    if (
      sessionUser.role === "ADMIN" ||
      String(sessionUser.id) === resourceUserId
    ) {
      return next();
    }
    return apiResponse(
      res,
      403,
      false,
      "Access denied. You can only access your own resources.",
    );
  };
};

module.exports = { isAuthenticated, isAdmin, isOwnerOrAdmin };
