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
 * Generate a secure signed QR token
 */
const generateQRToken = (ticketCode, bookingReference, eventDate) => {
  const secret = process.env.QR_SECRET_KEY;
  if (!secret) {
    throw new Error("QR_SECRET_KEY is not defined in environment variables");
  }
  const payload = {
    code: ticketCode,
    ref: bookingReference,
    date: eventDate,
    park: "BORA",
    ts: Math.floor(Date.now() / 1000), // Use Unix timestamp for brevity
  };

  // 1. Stringify the payload
  const message = JSON.stringify(payload);

  // 2. Create the HMAC signature
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);
  const signature = hmac.digest("hex");

  // 4. Return both the data and the signature
  return `${Buffer.from(message).toString("base64")}.${signature}`;
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
  generateQRToken,
  formatCurrency,
  apiResponse,
};
