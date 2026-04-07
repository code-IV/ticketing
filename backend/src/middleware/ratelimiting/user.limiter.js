const rateLimit = require("express-rate-limit");

exports.userLimiter = {
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
  }),

  getUserLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
};
