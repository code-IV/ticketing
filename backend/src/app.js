const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const sessionConfig = require("./config/session");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const noCache = require("./middleware/noCache");

// Import routes
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadsRoute = require("./routes/uploadsRoute");
const analyticsRoutes = require("./routes/analyticsRoutes");
const metricsRoute = require("./routes/metricsRoutes");
const gameRoutes = require("./routes/gameRoutes");
const buyTicketRoutes = require("./routes/buyTicket");

const app = express();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: true, //process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session(sessionConfig));

// ============================================
// STATIC FILE
// ============================================
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ============================================
// API ROUTES
// ============================================

// Apply no-cache middleware to all API routes
app.use("/api", noCache);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/media", uploadsRoute);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/metrics", metricsRoute);
app.use("/api/admin", gameRoutes);
app.use("/api/buy", buyTicketRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
