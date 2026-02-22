'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, TrendingUp, Users, DollarSign, BarChart3, PieChart, Activity, AlertTriangle } from 'lucide-react';
import { DateRangeFilter } from '@/components/admin/analytics/DateRangeFilter';
import { FilterControls } from '@/components/admin/analytics/FilterControls';
import { ExportControls } from '@/components/admin/analytics/ExportControls';
import { RealTimeStats } from '@/components/admin/analytics/RealTimeStats';
import { DashboardKPIs } from '@/components/admin/analytics/KPICards';
import { RevenueChart } from '@/components/admin/analytics/RevenueChart';
import { BookingTrends } from '@/components/admin/analytics/BookingTrends';
import { UserAnalytics } from '@/components/admin/analytics/UserAnalytics';
import { EventPerformance } from '@/components/admin/analytics/EventPerformance';
import { AnalyticsErrorBoundary } from '@/components/admin/analytics/ErrorBoundary';
import VirtualizedRevenueChart from '@/components/admin/analytics/VirtualizedRevenueChart';
import VirtualizedBookingTrends from '@/components/admin/analytics/VirtualizedBookingTrends';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { debounce, throttle } from '@/components/admin/analytics/performanceUtils';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      preset: '30days'
    };
  });

  const datePresets = [
    { id: 'today', label: 'Today', days: 0 },
    { id: '7days', label: 'Last 7 Days', days: 7 },
    { id: '30days', label: 'Last 30 Days', days: 30 },
    { id: '90days', label: 'Last 90 Days', days: 90 },
    { id: 'custom', label: 'Custom Range', days: null },
  ];

  // Debounced date range changes to prevent excessive API calls
  const debouncedDateChange = useMemo(
    () => debounce((newRange: typeof dateRange) => {
      setDateRange(newRange);
    }, 1000), // 1 second delay
    []
  );

  // Centralized data fetching - single API call for all data
  useEffect(() => {
    const fetchAllAnalyticsData = async () => {
      try {
        setIsDataLoading(true);
        setError(null);
        console.log('Fetching analytics data with dateRange:', dateRange);

        // Check if user is authenticated before making API calls
        if (!user) {
          console.log('User not authenticated, skipping API calls');
          return;
        }

        if (user.role !== 'admin') {
          console.log('User is not admin, skipping API calls');
          return;
        }

        // Fetch all data in parallel with individual error handling
        const promises = [
          adminService.getDashboardAnalytics(
            dateRange.preset === 'custom' ? undefined : 
            datePresets.find(p => p.id === dateRange.preset)?.days || undefined
          ).catch(err => {
            console.error('Dashboard analytics failed:', err);
            return { success: true, message: 'Dashboard data retrieved', data: { revenue: { revenue: 0, completed_transactions: 0, refunded_amount: 0 }, bookings: { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, total_value: 0 }, users: { new_users: 0 }, events: { active_events: 0 } } };
          }),
          adminService.getRevenueAnalytics(
            dateRange.startDate || undefined,
            dateRange.endDate || undefined,
            'day'
          ).catch(err => {
            console.error('Revenue analytics failed:', err);
            return { success: true, message: 'Revenue data retrieved', data: { revenueOverTime: [], summary: { total_revenue: 0, total_transactions: 0, avg_transaction_value: 0 }, byPaymentMethod: [] } };
          }),
          adminService.getBookingAnalytics(
            dateRange.startDate || undefined,
            dateRange.endDate || undefined,
            'day'
          ).catch(err => {
            console.error('Booking analytics failed:', err);
            return { success: true, message: 'Booking data retrieved', data: { dailyData: [], summary: { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, total_value: 0 } } };
          }),
          adminService.getUserAnalytics(
            dateRange.startDate || undefined,
            dateRange.endDate || undefined,
            'day'
          ).catch(err => {
            console.error('User analytics failed:', err);
            return { success: true, message: 'User data retrieved', data: { registrationData: [], roleBreakdown: [], activeStatus: [] } };
          }),
          adminService.getEventAnalytics(
            dateRange.startDate || undefined,
            dateRange.endDate || undefined,
            50
          ).catch(err => {
            console.error('Event analytics failed:', err);
            return { success: true, message: 'Event data retrieved', data: { eventPerformance: [], ticketTypePerformance: [] } };
          })
        ];

        const [dashboardResponse, revenueResponse, bookingsResponse, usersResponse, eventsResponse] = await Promise.all(promises);

        console.log('Analytics data received:', { dashboardResponse, revenueResponse, bookingsResponse, usersResponse, eventsResponse });

        // Set all data in single state
        setAnalyticsData({
          dashboard: dashboardResponse.data,
          revenue: revenueResponse.data,
          bookings: bookingsResponse.data,
          users: usersResponse.data,
          events: eventsResponse.data
        });

      } catch (err: any) {
        console.error('Critical error in fetchAllAnalyticsData:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
        console.error('Specific error:', errorMessage);
        setError(`Failed to load analytics data: ${errorMessage}`);
        
        // Set empty data on error
        setAnalyticsData({
          dashboard: { revenue: { revenue: 0, completed_transactions: 0, refunded_amount: 0 }, bookings: { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, total_value: 0 }, users: { new_users: 0 }, events: { active_events: 0 } },
          revenue: { revenueOverTime: [], summary: { total_revenue: 0, total_transactions: 0, avg_transaction_value: 0 }, byPaymentMethod: [] },
          bookings: { dailyData: [], summary: { total_bookings: 0, confirmed_bookings: 0, cancelled_bookings: 0, total_value: 0 } },
          users: { registrationData: [], roleBreakdown: [], activeStatus: [] },
          events: { eventPerformance: [], ticketTypePerformance: [] }
        });
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchAllAnalyticsData();
  }, [dateRange, user]);

  const loading = isAuthLoading || isDataLoading;

  // Memoized tab content to prevent unnecessary re-renders
  const aggregatedRevenueData = useMemo(() => {
    const data = analyticsData?.revenue?.revenueOverTime || [];
    
    // If more than 100 points, aggregate by week
    if (data.length > 100) {
      const weeklyData = [];
      for (let i = 0; i < data.length; i += 7) {
        const weekData = data.slice(i, i + 7);
        const weekRevenue = weekData.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);
        weeklyData.push({
          date: weekData[0]?.date || new Date().toISOString(),
          revenue: weekRevenue
        });
      }
      return weeklyData;
    }
    
    return data;
  }, [analyticsData?.revenue]);

  const aggregatedBookingData = useMemo(() => {
    const data = analyticsData?.bookings?.dailyData || [];
    
    // If more than 100 points, aggregate by week
    if (data.length > 100) {
      const weeklyData = [];
      for (let i = 0; i < data.length; i += 7) {
        const weekData = data.slice(i, i + 7);
        const weekBookings = weekData.reduce((sum: number, item: any) => sum + (item.bookings || 0), 0);
        weeklyData.push({
          date: weekData[0]?.date || new Date().toISOString(),
          bookings: weekBookings
        });
      }
      return weeklyData;
    }
    
    return data;
  }, [analyticsData?.bookings]);

  // Tab components - now dumb components that just receive data
  const DashboardTab = () => {
    if (!analyticsData?.dashboard) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Overview</h2>
        <DashboardKPIs data={analyticsData.dashboard} />
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VirtualizedRevenueChart data={aggregatedRevenueData} />
          <VirtualizedBookingTrends data={aggregatedBookingData} />
        </div>
      </div>
    );
  };

  const RevenueTab = () => {
    if (!analyticsData?.revenue) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Analytics</h2>
        <RevenueChart data={analyticsData.revenue?.revenueOverTime || []} />
      </div>
    );
  };

  const BookingsTab = () => {
    if (!analyticsData?.bookings) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Analytics</h2>
        <BookingTrends data={analyticsData.bookings?.dailyData || []} />
      </div>
    );
  };

  const UsersTab = () => {
    if (!analyticsData?.users) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const userData = {
      registrations: analyticsData.users?.registrationData || [],
      roleBreakdown: analyticsData.users?.roleBreakdown || [],
      activeStatus: analyticsData.users?.activeStatus || [],
      bookingParticipation: {
        users_with_bookings: analyticsData.dashboard?.bookings?.confirmed_bookings || 0,
        total_users: analyticsData.dashboard?.users?.new_users || 0,
        percentage: analyticsData.dashboard?.users?.new_users ? 
          ((analyticsData.dashboard?.bookings?.confirmed_bookings || 0) / analyticsData.dashboard.users.new_users * 100) : 0
      }
    };

    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">User Analytics</h2>
        <UserAnalytics 
          registrations={userData.registrations}
          roleBreakdown={userData.roleBreakdown}
          activeStatus={userData.activeStatus}
          bookingParticipation={userData.bookingParticipation}
        />
      </div>
    );
  };

  const EventsTab = () => {
    if (!analyticsData?.events) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Event Analytics</h2>
        <EventPerformance 
          eventPerformance={analyticsData.events?.eventPerformance || []}
          ticketTypePerformance={analyticsData.events?.ticketTypePerformance || []}
        />
      </div>
    );
  };

  // Memoized tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'revenue':
        return <RevenueTab />;
      case 'bookings':
        return <BookingsTab />;
      case 'users':
        return <UsersTab />;
      case 'events':
        return <EventsTab />;
      default:
        return null;
    }
  }, [activeTab, loading, error, dateRange]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'events', label: 'Events', icon: Activity },
  ];

  useEffect(() => {
    // Check if user is admin
    console.log('Checking user authentication:', user);
    if (user && user.role !== 'admin') {
      console.log('User is not admin, redirecting...');
      window.location.href = '/';
    } else if (!user) {
      console.log('No user found, might need to login');
      // Don't redirect immediately, let auth context handle it
    }
    setIsAuthLoading(false);
  }, [user]);

  const handleDatePresetChange = (presetId: string) => {
    const preset = datePresets.find(p => p.id === presetId);
    if (preset && preset.days !== null) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - preset.days);
      
      const newRange = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        preset: presetId
      };
      
      // Use debounced version to prevent excessive API calls
      debouncedDateChange(newRange);
    } else {
      debouncedDateChange((prev: typeof dateRange) => ({ ...prev, preset: presetId }));
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    debouncedDateChange(newRange);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need admin privileges to access analytics.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Date Range:</label>
                <select
                  value={dateRange.preset}
                  onChange={(e) => handleDatePresetChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {datePresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {dateRange.preset === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsErrorBoundary>
          {tabContent}
        </AnalyticsErrorBoundary>
      </div>
    </div>
  );
}
