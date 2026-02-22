# Analytics Dashboard Setup Guide

This guide covers setting up and configuring the analytics dashboard for the Bora Ticketing System.

## Prerequisites

### System Requirements

- **Node.js** 18+ 
- **PostgreSQL** 13+
- **Redis** (optional, for caching)
- **Nginx** (optional, for production)

### Dependencies

Frontend:
```bash
npm install recharts lucide-react
```

Backend:
```bash
npm install express-session cors helmet morgan
```

## Installation

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run db:migrate

# Seed analytics data (optional)
npm run db:seed

# Start backend server
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start frontend server
npm run dev
```

## Configuration

### Environment Variables

#### Backend (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bora_ticketing
DB_USER=postgres
DB_PASSWORD=your_password

# Session Configuration
SESSION_SECRET=your_secret_key_here
SESSION_TIMEOUT=86400000

# Analytics Configuration
ANALYTICS_CACHE_TTL=300
ANALYTICS_RATE_LIMIT=100
ANALYTICS_BATCH_SIZE=1000

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ANALYTICS_REFRESH_INTERVAL=30000
NEXT_PUBLIC_ENABLE_ANALYTICS_DEBUG=false
```

### Database Setup

#### PostgreSQL Configuration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create analytics indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_revenue_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_analytics_bookings_date ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_users_date ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON events(event_date);

-- Create materialized views for complex queries
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_revenue AS
SELECT 
  DATE(payment_date) as date,
  SUM(amount) as revenue,
  COUNT(*) as transaction_count
FROM payments 
WHERE status = 'completed'
GROUP BY DATE(payment_date);

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW analytics_daily_revenue;
END;
$$ LANGUAGE plpgsql;
```

#### Redis Configuration (Optional)

```redis
# Redis configuration for analytics caching
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Analytics Features

### 1. Revenue Analytics

Tracks financial performance with:
- Daily/weekly/monthly revenue trends
- Transaction volume and averages
- Growth rate calculations
- Payment method breakdown

**Configuration:**
```javascript
// analyticsController.js
const revenueConfig = {
  cacheTTL: 300, // 5 minutes
  batchSize: 1000,
  dateFormat: 'YYYY-MM-DD',
  currency: 'USD'
};
```

### 2. Booking Analytics

Monitors booking patterns and trends:
- Booking confirmation rates
- Cancellation analysis
- Seasonal patterns
- Revenue per booking

**Configuration:**
```javascript
const bookingConfig = {
  includePending: true,
  calculateTrends: true,
  seasonalAnalysis: true
};
```

### 3. User Analytics

Tracks user engagement and growth:
- Registration trends
- Active user metrics
- Role distribution
- Session analytics

**Configuration:**
```javascript
const userConfig = {
  activeThreshold: 30, // days
  includeRoles: ['admin', 'visitor'],
  trackSessions: true
};
```

### 4. Event Analytics

Analyzes event performance:
- Attendance rates
- Revenue per event
- Ticket type performance
- Capacity utilization

**Configuration:**
```javascript
const eventConfig = {
  defaultLimit: 50,
  sortBy: 'revenue',
  includeTicketTypes: true
};
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Create optimized indexes
CREATE INDEX CONCURRENTLY idx_payments_date_status 
ON payments(payment_date, status) 
WHERE status = 'completed';

-- Partition large tables (optional)
CREATE TABLE payments_2024 PARTITION OF payments
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Set up automatic refresh
CREATE OR REPLACE FUNCTION schedule_analytics_refresh()
RETURNS void AS $$
BEGIN
  PERFORM refresh_analytics_views();
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
SELECT cron.schedule('0 */5 * * * *', 'SELECT schedule_analytics_refresh();');
```

### 2. Caching Strategy

```javascript
// Redis caching implementation
const cache = {
  async get(key) {
    return await redis.get(`analytics:${key}`);
  },
  
  async set(key, value, ttl = 300) {
    return await redis.setex(`analytics:${key}`, ttl, JSON.stringify(value));
  },
  
  async invalidate(pattern) {
    const keys = await redis.keys(`analytics:${pattern}`);
    return keys.length > 0 ? await redis.del(...keys) : 0;
  }
};

// Cache middleware
const analyticsCache = async (req, res, next) => {
  const cacheKey = `analytics:${req.originalUrl}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  res.locals.cacheKey = cacheKey;
  next();
};
```

### 3. Frontend Optimization

```typescript
// Performance utilities
import { debounce, memoize } from './performanceUtils';

// Debounced API calls
const debouncedFetch = debounce(
  (startDate, endDate) => fetchAnalytics(startDate, endDate),
  300
);

// Memoized calculations
const memoizedAggregation = memoize(
  (data) => aggregateAnalyticsData(data),
  (data) => JSON.stringify(data.slice(0, 10)) // Cache key
);

// Lazy loading for large datasets
const useLazyAnalytics = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const loadData = useCallback(async () => {
    if (data) return; // Already loaded
    
    setLoading(true);
    try {
      const result = await fetchAnalytics(endpoint);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [endpoint, data]);
  
  return { data, loading, loadData };
};
```

## Security Configuration

### 1. Access Control

```javascript
// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Apply to analytics routes
app.use('/api/analytics', requireAdmin);
```

### 2. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many analytics requests'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/analytics', analyticsLimiter);
```

### 3. Input Validation

```javascript
const Joi = require('joi');

const analyticsSchema = Joi.object({
  startDate: Joi.date().iso().max('now'),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year'),
  limit: Joi.number().integer().min(1).max(1000)
});

// Validation middleware
const validateAnalytics = (req, res, next) => {
  const { error } = analyticsSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
```

## Monitoring and Logging

### 1. Analytics Logging

```javascript
// Custom analytics logger
const analyticsLogger = {
  info: (message, meta = {}) => {
    console.log(`[ANALYTICS] ${message}`, {
      timestamp: new Date().toISOString(),
      ...meta
    });
  },
  
  error: (message, error) => {
    console.error(`[ANALYTICS ERROR] ${message}`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
  },
  
  performance: (operation, duration) => {
    console.log(`[ANALYTICS PERF] ${operation}: ${duration}ms`);
  }
};
```

### 2. Health Monitoring

```javascript
// Health check endpoint
app.get('/api/analytics/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {
      database: await checkDatabaseHealth(),
      cache: await checkCacheHealth(),
      memory: checkMemoryUsage(),
      uptime: process.uptime()
    }
  };
  
  const isHealthy = Object.values(health.checks)
    .every(check => check.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

### 3. Performance Metrics

```javascript
// Performance monitoring
const performanceMonitor = {
  startTiming: (operation) => {
    performance.mark(`${operation}-start`);
  },
  
  endTiming: (operation) => {
    performance.mark(`${operation}-end`);
    performance.measure(operation, `${operation}-start`, `${operation}-end`);
    
    const measure = performance.getEntriesByName(operation)[0];
    if (measure) {
      analyticsLogger.performance(operation, measure.duration);
    }
  }
};

// Usage in analytics controller
exports.getRevenueAnalytics = async (req, res) => {
  performanceMonitor.startTiming('revenue-analytics');
  
  try {
    // ... analytics logic
    res.json(result);
  } finally {
    performanceMonitor.endTiming('revenue-analytics');
  }
};
```

## Deployment

### 1. Development Deployment

```bash
# Start both services
npm run dev:all

# Or start separately
cd backend && npm run dev
cd frontend && npm run dev
```

### 2. Production Deployment

#### Backend (PM2)

```bash
# Install PM2
npm install -g pm2

# Start backend with PM2
pm2 start backend/src/server.js --name "analytics-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Frontend (Next.js)

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2
pm2 start npm --name "analytics-frontend" -- start
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Common Issues

#### 1. Analytics Not Loading

**Symptoms:** Dashboard shows loading state indefinitely

**Solutions:**
- Check backend server is running
- Verify database connection
- Check API endpoints are accessible
- Review browser console for errors

```bash
# Check backend health
curl http://localhost:3001/api/analytics/health

# Check database connection
psql -h localhost -U postgres -d bora_ticketing -c "SELECT 1;"
```

#### 2. Slow Performance

**Symptoms:** Analytics pages load slowly

**Solutions:**
- Check database indexes
- Verify Redis caching
- Monitor memory usage
- Review query performance

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%analytics%' 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 3. Incorrect Data

**Symptoms:** Analytics showing wrong numbers

**Solutions:**
- Refresh materialized views
- Check data consistency
- Verify date ranges
- Review aggregation logic

```sql
-- Refresh analytics views
SELECT refresh_analytics_views();

-- Check data consistency
SELECT 
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments
FROM payments;
```

#### 4. Permission Errors

**Symptoms:** Access denied errors

**Solutions:**
- Verify user role is 'admin'
- Check session configuration
- Review authentication middleware
- Clear browser cookies

```javascript
// Debug authentication
console.log('Session:', req.session);
console.log('User:', req.session?.user);
console.log('Role:', req.session?.user?.role);
```

### Debug Mode

Enable debug logging:

```javascript
// frontend/.env.local
NEXT_PUBLIC_ENABLE_ANALYTICS_DEBUG=true

// backend/.env
ANALYTICS_DEBUG=true
NODE_ENV=development
```

### Log Analysis

Monitor analytics logs:

```bash
# Backend logs
tail -f backend/logs/analytics.log

# PM2 logs
pm2 logs analytics-backend

# Nginx logs
tail -f /var/log/nginx/access.log | grep analytics
```

## Maintenance

### Regular Tasks

#### Daily

```bash
# Refresh analytics views
psql -d bora_ticketing -c "SELECT refresh_analytics_views();"

# Clear old cache entries
redis-cli --scan --pattern "analytics:*" | xargs redis-cli del
```

#### Weekly

```bash
# Update statistics
npm run analytics:update-stats

# Backup analytics data
pg_dump -h localhost -U postgres bora_ticketing > backup_$(date +%Y%m%d).sql

# Review performance metrics
npm run analytics:performance-report
```

#### Monthly

```bash
# Archive old data
npm run analytics:archive-data

# Update indexes
psql -d bora_ticketing -c "REINDEX DATABASE bora_ticketing;"

# Security audit
npm audit
```

---

This setup guide provides comprehensive instructions for deploying and maintaining the analytics dashboard with optimal performance and security.
