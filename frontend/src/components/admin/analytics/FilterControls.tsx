import { useState, useEffect } from 'react';
import { Filter, Calendar, CreditCard, Users } from 'lucide-react';

interface FilterControlsProps {
  onFiltersChange: (filters: AnalyticsFilters) => void;
  availableEvents?: Array<{ id: string; name: string }>;
  initialFilters?: Partial<AnalyticsFilters>;
}

interface AnalyticsFilters {
  events: string[];
  userRoles: string[];
  paymentMethods: string[];
  bookingStatus: string[];
}

export function FilterControls({ 
  onFiltersChange, 
  availableEvents = [],
  initialFilters = {}
}: FilterControlsProps) {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    events: [],
    userRoles: [],
    paymentMethods: [],
    bookingStatus: [],
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const eventOptions = [
    { id: 'all', name: 'All Events' },
    ...availableEvents
  ];

  const userRoleOptions = [
    { id: 'all', name: 'All Users' },
    { id: 'admin', name: 'Admin Users' },
    { id: 'visitor', name: 'Visitor Users' }
  ];

  const paymentMethodOptions = [
    { id: 'all', name: 'All Methods' },
    { id: 'credit_card', name: 'Credit Card' },
    { id: 'debit_card', name: 'Debit Card' },
    { id: 'telebirr', name: 'Telebirr' },
    { id: 'cash', name: 'Cash' }
  ];

  const bookingStatusOptions = [
    { id: 'all', name: 'All Status' },
    { id: 'confirmed', name: 'Confirmed' },
    { id: 'pending', name: 'Pending' },
    { id: 'cancelled', name: 'Cancelled' }
  ];

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (filterType: keyof AnalyticsFilters, value: string) => {
    const currentValues = filters[filterType];
    
    if (value === 'all') {
      setFilters(prev => ({ ...prev, [filterType]: [] }));
    } else {
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      setFilters(prev => ({ ...prev, [filterType]: newValues }));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      events: [],
      userRoles: [],
      paymentMethods: [],
      bookingStatus: []
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, filterArray) => {
      return count + filterArray.filter((value: string) => value !== 'all').length;
    }, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Options */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Event Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Events
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {eventOptions.map((event) => (
                <label key={event.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={event.id === 'all' ? filters.events.length === 0 : filters.events.includes(event.id)}
                    onChange={() => handleFilterChange('events', event.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{event.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* User Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-2" />
              User Roles
            </label>
            <div className="space-y-2">
              {userRoleOptions.map((role) => (
                <label key={role.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={role.id === 'all' ? filters.userRoles.length === 0 : filters.userRoles.includes(role.id)}
                    onChange={() => handleFilterChange('userRoles', role.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{role.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="h-4 w-4 inline mr-2" />
              Payment Methods
            </label>
            <div className="space-y-2">
              {paymentMethodOptions.map((method) => (
                <label key={method.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={method.id === 'all' ? filters.paymentMethods.length === 0 : filters.paymentMethods.includes(method.id)}
                    onChange={() => handleFilterChange('paymentMethods', method.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{method.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Booking Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-2" />
              Booking Status
            </label>
            <div className="space-y-2">
              {bookingStatusOptions.map((status) => (
                <label key={status.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={status.id === 'all' ? filters.bookingStatus.length === 0 : filters.bookingStatus.includes(status.id)}
                    onChange={() => handleFilterChange('bookingStatus', status.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{status.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
            </span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
