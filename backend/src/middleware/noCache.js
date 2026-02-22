/**
 * No Cache Middleware
 * Disables caching for all API endpoints to prevent 304 responses
 */

const noCache = (req, res, next) => {
  // Disable caching for all API endpoints
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('ETag', ''); // Clear ETag to prevent 304 responses
  
  next();
};

module.exports = noCache;
