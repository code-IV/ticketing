# Analytics API Documentation

This document describes the analytics API endpoints for the Bora Ticketing System.

## Overview

The analytics API provides comprehensive data insights for:
- Revenue tracking and trends
- Booking analytics and patterns
- User registration and activity
- Event performance metrics
- Real-time dashboard statistics

## Base URL

```
http://localhost:3001/api/analytics
```

## Authentication

All analytics endpoints require:
- **Admin role** authentication
- **Valid session** cookie
- **Authorization** header (if using token auth)

## Endpoints

### GET /analytics/revenue

Retrieve revenue analytics with optional filtering.

**Endpoint:** `GET /api/analytics/revenue`

**Query Parameters:**
- `startDate` (string, optional) - Start date in YYYY-MM-DD format
- `endDate` (string, optional) - End date in YYYY-MM-DD format
- `groupBy` (string, optional) - Grouping level: 'day', 'week', 'month', 'year'

**Example Request:**
```bash
GET /api/analytics/revenue?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": "50000.00",
      "transactionCount": 1250,
      "averageTransaction": "40.00",
      "growthRate": 15.5
    },
    "dailyData": [
      {
        "date": "2024-01-01",
        "revenue": "1500.00",
        "transaction_count": 37
      }
    ],
    "comparison": {
      "previousPeriod": "43250.00",
      "change": "6750.00",
      "changePercentage": 15.6
    }
  }
}
```

### GET /analytics/bookings

Retrieve booking analytics and trends.

**Endpoint:** `GET /api/analytics/bookings`

**Query Parameters:**
- `startDate` (string, optional) - Start date in YYYY-MM-DD format
- `endDate` (string, optional) - End date in YYYY-MM-DD format
- `groupBy` (string, optional) - Grouping level: 'day', 'week', 'month'
- `status` (string, optional) - Filter by booking status: 'confirmed', 'pending', 'cancelled'

**Example Request:**
```bash
GET /api/analytics/bookings?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBookings": 1250,
      "confirmedBookings": 1100,
      "pendingBookings": 100,
      "cancelledBookings": 50,
      "confirmationRate": 88.0,
      "cancellationRate": 4.0
    },
    "dailyData": [
      {
        "date": "2024-01-01",
        "total_bookings": 45,
        "confirmed_bookings": 40,
        "pending_bookings": 3,
        "cancelled_bookings": 2,
        "total_value": "1800.00"
      }
    ],
    "trends": {
      "growthRate": 12.5,
      "seasonalPattern": "increasing"
    }
  }
}
```

### GET /analytics/users

Retrieve user analytics and registration trends.

**Endpoint:** `GET /api/analytics/users`

**Query Parameters:**
- `startDate` (string, optional) - Start date in YYYY-MM-DD format
- `endDate` (string, optional) - End date in YYYY-MM-DD format
- `groupBy` (string, optional) - Grouping level: 'day', 'week', 'month'
- `role` (string, optional) - Filter by user role: 'admin', 'visitor'

**Example Request:**
```bash
GET /api/analytics/users?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 5000,
      "activeUsers": 3200,
      "newUsers": 150,
      "userGrowthRate": 8.5,
      "averageSessionDuration": "25.5"
    },
    "registrationData": [
      {
        "date": "2024-01-01",
        "new_users": 12,
        "active_users": 2800
      }
    ],
    "roleBreakdown": [
      {
        "role": "admin",
        "count": 50,
        "percentage": 1.0
      },
      {
        "role": "visitor",
        "count": 4950,
        "percentage": 99.0
      }
    ],
    "activityMetrics": {
      "dailyActiveUsers": 1200,
      "weeklyActiveUsers": 2800,
      "monthlyActiveUsers": 3200
    }
  }
}
```

### GET /analytics/events

Retrieve event performance analytics.

**Endpoint:** `GET /api/analytics/events`

**Query Parameters:**
- `startDate` (string, optional) - Start date in YYYY-MM-DD format
- `endDate` (string, optional) - End date in YYYY-MM-DD format
- `limit` (number, optional) - Limit number of events returned (default: 50)
- `sortBy` (string, optional) - Sort field: 'revenue', 'bookings', 'attendance'
- `order` (string, optional) - Sort order: 'asc', 'desc' (default: 'desc')

**Example Request:**
```bash
GET /api/analytics/events?startDate=2024-01-01&endDate=2024-01-31&limit=20&sortBy=revenue&order=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventPerformance": [
      {
        "id": "event_123",
        "name": "Summer Music Festival",
        "event_date": "2024-01-15",
        "capacity": 5000,
        "tickets_sold": 4500,
        "attendance_rate": 90.0,
        "total_revenue": "225000.00",
        "booking_count": 1800,
        "avg_booking_value": "125.00"
      }
    ],
    "ticketTypePerformance": [
      {
        "ticket_type_name": "VIP Pass",
        "category": "adult",
        "total_sold": 500,
        "total_tickets": 500,
        "total_revenue": "75000.00",
        "avg_price": "150.00"
      }
    ],
    "summary": {
      "totalEvents": 25,
      "totalRevenue": "500000.00",
      "totalBookings": 8500,
      "averageAttendanceRate": 85.5,
      "topPerformingEvent": "Summer Music Festival"
    }
  }
}
```

### GET /analytics/dashboard

Retrieve real-time dashboard statistics.

**Endpoint:** `GET /api/analytics/dashboard`

**Query Parameters:**
- `days` (number, optional) - Number of days for statistics (default: 30)

**Example Request:**
```bash
GET /api/analytics/dashboard?days=30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "today": "2500.00",
      "thisWeek": "15000.00",
      "thisMonth": "50000.00",
      "growth": {
        "daily": 5.2,
        "weekly": 8.7,
        "monthly": 12.5
      }
    },
    "bookings": {
      "today": 125,
      "thisWeek": 750,
      "thisMonth": 2500,
      "confirmationRate": 88.5,
      "cancellationRate": 4.2
    },
    "users": {
      "total": 5000,
      "active": 3200,
      "newToday": 15,
      "newThisWeek": 85,
      "newThisMonth": 150
    },
    "events": {
      "total": 25,
      "active": 8,
      "upcoming": 12,
      "completed": 5
    },
    "payments": {
      "methods": [
        {
          "payment_method": "credit_card",
          "revenue": "30000.00",
          "count": 800,
          "percentage": 60.0
        },
        {
          "payment_method": "telebirr",
          "revenue": "15000.00",
          "count": 400,
          "percentage": 30.0
        },
        {
          "payment_method": "cash",
          "revenue": "5000.00",
          "count": 50,
          "percentage": 10.0
        }
      ]
    }
  }
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - User not authenticated or not admin
- `INVALID_DATE_RANGE` - Start date is after end date
- `INVALID_PARAMETERS` - Invalid query parameters
- `DATA_NOT_FOUND` - No data found for specified criteria
- `INTERNAL_ERROR` - Server error

## Rate Limiting

Analytics endpoints have rate limiting:
- **100 requests per minute** per user
- **1000 requests per hour** per user

Rate limit headers are included:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Caching

Responses are cached for performance:
- **Dashboard data**: 5 minutes
- **Revenue/Booking data**: 15 minutes
- **User/Event data**: 30 minutes

Cache control headers:
```
Cache-Control: public, max-age=300
ETag: "analytics-data-hash"
```

## Data Formats

### Date Format

All dates use ISO 8601 format:
- **Input**: `YYYY-MM-DD`
- **Output**: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Currency Format

All monetary values:
- **Type**: String
- **Format**: Decimal with 2 places
- **Currency**: USD (configurable)

### Numbers

Large numbers are formatted for readability:
- **Revenue**: String with decimal places
- **Counts**: Integer
- **Percentages**: Decimal with 1-2 places

## Performance Considerations

### Query Optimization

- Use specific date ranges when possible
- Limit result sets with `limit` parameter
- Use appropriate `groupBy` levels
- Cache frequently accessed data

### Best Practices

1. **Date Filtering**: Always provide both start and end dates
2. **Pagination**: Use `limit` for large datasets
3. **Caching**: Implement client-side caching for dashboard data
4. **Error Handling**: Check error codes and retry appropriately
5. **Rate Limiting**: Respect rate limits and implement backoff

## Security

### Authentication

- **Session-based** authentication required
- **Admin role** verification
- **CSRF protection** enabled
- **SQL injection** prevention

### Data Access

- **User isolation** - Admins only see their data
- **Field filtering** - Sensitive data excluded
- **Audit logging** - All analytics requests logged

## SDK Integration

### JavaScript/TypeScript

```typescript
import { adminService } from '@/services/adminService';

// Get revenue analytics
const revenueData = await adminService.getRevenueAnalytics(
  '2024-01-01',
  '2024-01-31',
  'day'
);

// Get dashboard stats
const dashboardData = await adminService.getDashboardAnalytics(30);
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';

function useAnalytics(startDate: string, endDate: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminService.getRevenueAnalytics(startDate, endDate);
        setData(result.data);
      } catch (error) {
        console.error('Analytics error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  return { data, loading };
}
```

## Testing

### Mock Data

For testing, use the mock endpoints:
- `GET /api/analytics/mock/revenue`
- `GET /api/analytics/mock/bookings`
- `GET /api/analytics/mock/users`
- `GET /api/analytics/mock/events`

### Test Scenarios

Test various scenarios:
- **Date ranges** - Different start/end combinations
- **Empty data** - No data for date range
- **Large datasets** - Performance with many records
- **Error handling** - Invalid parameters, network errors

## Monitoring

### Health Check

Check analytics API health:
```
GET /api/analytics/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "cache": "active"
}
```

### Metrics

Analytics API provides metrics at:
```
GET /api/analytics/metrics
```

Includes:
- Request counts
- Response times
- Error rates
- Cache hit ratios

---

This API provides comprehensive analytics capabilities for the Bora Ticketing System with real-time data, flexible filtering, and enterprise-level performance.
