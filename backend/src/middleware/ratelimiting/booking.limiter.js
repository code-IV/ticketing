const rateLimit = require("express-rate-limit");

exports.bookingLimiter = {
  createBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many booking attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  writeBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many booking attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  myBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  getBookingLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  bookingStatsLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  punch: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  scan: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: "Too many requests. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),
};
