const rateLimit = require("express-rate-limit");

exports.bookingLimiter = {
  createBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many booking attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    // Key by User ID if logged in, otherwise IP
    keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  }),

  writeBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many booking attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    // Key by User ID if logged in, otherwise IP
    keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  }),

  myBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
    // Key by User ID if logged in, otherwise IP
    keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  }),

  getBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
    // Key by User ID if logged in, otherwise IP
    keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  }),

  bookingStatsLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
    // Key by User ID if logged in, otherwise IP
    keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  }),
};
