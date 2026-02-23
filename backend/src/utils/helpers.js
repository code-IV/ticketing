const crypto = require("crypto");

/**
 * Generate a unique booking reference (e.g., BORA-XXXXXX)
 */
const generateBookingReference = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "BORA-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a unique ticket code
 */
const generateTicketCode = () => {
  return "TKT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
};

/**
 * Generate QR data string for a ticket
 */
const generateQRData = (ticketCode, bookingReference, eventDate) => {
  return JSON.stringify({
    code: ticketCode,
    ref: bookingReference,
    date: eventDate,
    park: "BORA",
    ts: Date.now(),
  });
};

/**
 * Format currency for ETB
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
  }).format(amount);
};

/**
 * Standard API response format
 */
const apiResponse = (res, statusCode, success, message, data = null) => {
  const response = { success, message };
  if (data !== null) {
    response.data = data;
  }

  const timestamp = new Date().toISOString();
  const method = res.req ? res.req.method : "UNKNOWN";
  const url = res.req ? res.req.originalUrl : "UNKNOWN";
  const statusIcon = success ? "✅" : "❌";

  console.log(
    `${statusIcon} ${method} ${url} - Status: ${statusCode} - Msg: ${message} --- [${timestamp}]`,
  );

  // Only log data in development mode or for errors
  if (!success && data) {
    console.error("   Details:", JSON.stringify(data, null, 2));
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  generateBookingReference,
  generateTicketCode,
  generateQRData,
  formatCurrency,
  apiResponse,
};
