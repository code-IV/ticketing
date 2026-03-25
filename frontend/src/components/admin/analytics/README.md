# Analytics Dashboard

A comprehensive analytics dashboard for the Bora Ticketing System that provides real-time insights into revenue, bookings, users, and events.

## Overview

The analytics system provides:
- **Real-time monitoring** with live statistics
- **Interactive visualizations** using Recharts
- **Advanced filtering** by date, events, users, and payments
- **Export capabilities** for reporting and analysis
- **Mobile responsive** design for all screen sizes
- **Performance optimized** with debouncing and memoization

## Architecture

### Components Structure

```
analytics/
├── KPICards.tsx              # Key performance indicators
├── RevenueChart.tsx           # Revenue visualization
├── BookingTrends.tsx         # Booking analytics
├── UserAnalytics.tsx          # User metrics
├── EventPerformance.tsx       # Event performance
├── PaymentBreakdown.tsx        # Payment method analysis
├── DateRangeFilter.tsx        # Date range selection
├── FilterControls.tsx         # Multi-category filtering
├── ExportControls.tsx         # Data export functionality
├── RealTimeStats.tsx         # Live statistics
├── ErrorBoundary.tsx          # Error handling
├── performanceUtils.ts        # Performance utilities
└── __tests__/               # Test suite
```

### Data Flow

1. **User Interaction** → Filter/Date changes
2. **Debounced API Calls** → Backend analytics endpoints
3. **Data Processing** → Performance utilities
4. **Component Rendering** → Visualizations and KPIs
5. **Error Handling** → Graceful fallbacks

## Components

### KPICards

Displays key performance indicators with trends.

```tsx
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange';
  isLoading?: boolean;
}
```

**Usage:**
```tsx
<KPICard
  title="Total Revenue"
  value="$10,000"
  icon={<DollarSign />}
  trend={{ value: 15, isPositive: true }}
  color="green"
/>
```

### DateRangeFilter

Provides date range selection with presets and custom dates.

```tsx
interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  initialPreset?: string;
}
```

**Presets:**
- `today` - Current day
- `7days` - Last 7 days
- `30days` - Last 30 days
- `90days` - Last 90 days
- `custom` - Custom date range

### FilterControls

Multi-category filtering for analytics data.

```tsx
interface FilterControlsProps {
  onFiltersChange: (filters: AnalyticsFilters) => void;
  availableEvents?: Array<{ id: string; name: string }>;
}
```

**Filter Categories:**
- Events (multi-select)
- User Roles (admin/visitor)
- Payment Methods (credit/debit cards, telebirr, cash)
- Booking Status (confirmed/pending/cancelled)

### ExportControls

Data export functionality for analytics.

```tsx
interface ExportControlsProps {
  data: any;
  fileName?: string;
  title?: string;
  onExport?: (type: 'csv' | 'pdf' | 'print') => void;
}
```

**Export Formats:**
- **CSV** - Spreadsheet-compatible data
- **PDF** - Formatted report documents
- **Print** - Direct print with optimized formatting

## Charts

### RevenueChart

Line chart showing revenue trends over time.

**Features:**
- Responsive design
- Interactive tooltips
- Date formatting
- Currency formatting

### BookingTrends

Stacked bar chart for booking status breakdown.

**Data Series:**
- Confirmed bookings
- Cancelled bookings
- Pending bookings

### UserAnalytics

Line chart for user registration trends.

**Metrics:**
- New user registrations
- Role breakdown
- Activity statistics

### EventPerformance

Table and charts for event performance.

**Metrics:**
- Attendance rates
- Revenue per event
- Booking counts
- Average booking value

### PaymentBreakdown

Pie chart for payment method distribution.

**Payment Methods:**
- Credit/Debit cards
- Telebirr
- Cash

## Performance Optimization

### Debouncing

Prevents excessive API calls during rapid user interactions.

```tsx
import { debounce } from './performanceUtils';

const debouncedFetch = debounce(fetchData, 300);
```

### Memoization

Caches expensive calculations to prevent redundant processing.

```tsx
import { memoize } from './performanceUtils';

const memoizedCalculation = memoize(expensiveFunction);
```

### Throttling

Limits update frequency for performance-critical operations.

```tsx
import { throttle } from './performanceUtils';

const throttledUpdate = throttle(updateFunction, 1000);
```

## Error Handling

### Error Boundary

Catches and handles component-level errors gracefully.

**Features:**
- Custom fallback UI
- Error reporting
- Retry functionality
- User-friendly messages

### Error States

Components handle various error scenarios:
- Network failures
- Invalid data
- Loading timeouts
- API errors

## Testing

### Test Suite

Located in `__tests__/` directory:

- **KPICards.test.tsx** - Unit tests for KPI cards
- **DateRangeFilter.test.tsx** - Unit tests for date filtering
- **integration.test.tsx** - Integration tests for analytics page

### Running Tests

```bash
npm test analytics
```

### Test Coverage

- Component rendering
- User interactions
- State changes
- Error scenarios
- Accessibility

## API Integration

### Analytics Endpoints

```typescript
// Revenue analytics
adminService.getRevenueAnalytics(startDate, endDate, groupBy)

// Booking analytics  
adminService.getBookingAnalytics(startDate, endDate, groupBy)

// User analytics
adminService.getUserAnalytics(startDate, endDate, groupBy)

// Event analytics
adminService.getEventAnalytics(startDate, endDate, limit)

// Dashboard analytics
adminService.getDashboardAnalytics(days)
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

## Styling

### Design System

- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for visualizations
- **Responsive design** with mobile-first approach

### Color Scheme

- **Blue** - Primary actions and links
- **Green** - Positive trends and success
- **Red** - Negative trends and errors
- **Purple** - User-related metrics
- **Orange** - Event-related metrics

## Accessibility

### Features

- **Screen reader** compatibility
- **Keyboard navigation** support
- **ARIA labels** on interactive elements
- **Color contrast** compliance
- **Focus indicators** for navigation

### Testing

Use accessibility testing tools:
- axe-core for automated testing
- Screen reader testing
- Keyboard navigation testing

## Deployment

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ANALYTICS_REFRESH_INTERVAL=30000
```

### Build Process

```bash
npm run build
npm run start
```

### Performance Monitoring

Built-in performance tracking:

```typescript
import { PerformanceMonitor } from './performanceUtils';

PerformanceMonitor.startTiming('analytics-load');
// ... operations
const duration = PerformanceMonitor.endTiming('analytics-load');
```

## Troubleshooting

### Common Issues

**Charts not rendering:**
- Check data format
- Verify Recharts installation
- Check console for errors

**Filters not working:**
- Verify API integration
- Check callback functions
- Validate data structure

**Export failing:**
- Check data format
- Verify browser compatibility
- Check file permissions

**Performance issues:**
- Check data size
- Verify debouncing
- Monitor memory usage

### Debug Mode

Enable debug logging:

```tsx
const debugMode = process.env.NODE_ENV === 'development';
```

### Support

For issues and questions:
1. Check browser console for errors
2. Verify API connectivity
3. Check network requests in dev tools
4. Review component props and data structure

## Future Enhancements

### Planned Features

- **Real-time WebSocket** updates
- **Advanced filtering** with saved presets
- **Custom report builder**
- **Data annotations** and events
- **Mobile app** integration
- **Advanced visualizations** (heatmaps, funnels)

### Performance Improvements

- **Virtual scrolling** for large datasets
- **Web Workers** for data processing
- **Service Worker** caching
- **Progressive loading** strategies

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Start development: `npm run dev`
3. Run tests: `npm test`
4. Check linting: `npm run lint`

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

---

This analytics dashboard provides comprehensive insights into the Bora Ticketing System with enterprise-level features, performance optimization, and robust error handling.
