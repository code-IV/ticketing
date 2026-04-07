const rateLimit = require("express-rate-limit");

exports.eventLimiter = {
  createLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many booking attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  writeLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many booking attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  listLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  getAllLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  statsLimit: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: "Too many requests to fetch history. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
  }),
};
