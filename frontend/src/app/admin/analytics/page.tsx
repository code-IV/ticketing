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
import { DashboardKPIs, KPICard } from '@/components/admin/analytics/KPICards';
import { RevenueChart } from '@/components/admin/analytics/RevenueChart';
import { BookingTrends } from '@/components/admin/analytics/BookingTrends';
import { UserAnalytics } from '@/components/admin/analytics/UserAnalytics';
import { EventPerformance } from '@/components/admin/analytics/EventPerformance';
import { PaymentBreakdown } from '@/components/admin/analytics/PaymentBreakdown';
import { AnalyticsErrorBoundary } from '@/components/admin/analytics/ErrorBoundary';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { debounce, throttle } from '@/components/admin/analytics/performanceUtils';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    preset: '30days'
  });

  // Optimized data fetching with error handling
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getDashboardAnalytics(
        dateRange.preset === 'custom' ? undefined : 
        datePresets.find(p => p.id === dateRange.preset)?.days || undefined
      );
      return response.data;
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getRevenueAnalytics(
        dateRange.startDate,
        dateRange.endDate,
        'day'
      );
      return response.data;
    } catch (err) {
      console.error('Failed to fetch revenue data:', err);
      setError('Failed to load revenue data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Tab components
  const DashboardTab = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [bookingData, setBookingData] = useState([]);
    
    useEffect(() => {
      fetchDashboardData().then(data => setDashboardData(data)).catch(console.error);
      fetchRevenueData().then(data => setRevenueData(data.dailyData || [])).catch(console.error);
      // You can add booking data fetching here
    }, [fetchDashboardData, fetchRevenueData]);
    
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Overview</h2>
        {dashboardData ? (
          <DashboardKPIs data={dashboardData} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* KPI Cards Placeholder */}
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">$0</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Users</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Events</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={revenueData} />
          <BookingTrends data={bookingData} />
        </div>
      </div>
    );
  };

  const RevenueTab = () => {
    const [revenueData, setRevenueData] = useState([]);
    
    useEffect(() => {
      fetchRevenueData().then(data => setRevenueData(data.dailyData || [])).catch(console.error);
    }, [fetchRevenueData]);
    
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Analytics</h2>
        <RevenueChart data={revenueData} />
      </div>
    );
  };

  const BookingsTab = () => {
    const [bookingData, setBookingData] = useState([]);
    
    useEffect(() => {
      adminService.getBookingAnalytics(dateRange.startDate, dateRange.endDate, 'day')
        .then(response => setBookingData(response.data.dailyData || []))
        .catch(console.error);
    }, [dateRange]);
    
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Analytics</h2>
        <BookingTrends data={bookingData} />
      </div>
    );
  };

  const UsersTab = () => {
    const [userData, setUserData] = useState<any>(null);
    
    useEffect(() => {
      adminService.getUserAnalytics(dateRange.startDate, dateRange.endDate, 'day')
        .then(response => {
          const data = response.data;
          setUserData({
            registrations: data.registrationData || [],
            roleBreakdown: data.roleBreakdown || [],
            activeStatus: data.activityMetrics ? [
              { is_active: true, count: data.activityMetrics.dailyActiveUsers || 0 },
              { is_active: false, count: (data.summary?.totalUsers || 0) - (data.activityMetrics?.dailyActiveUsers || 0) }
            ] : [],
            bookingParticipation: {
              users_with_bookings: data.summary?.activeUsers || 0,
              total_users: data.summary?.totalUsers || 0,
              percentage: data.summary?.totalUsers ? ((data.summary?.activeUsers || 0) / data.summary.totalUsers * 100) : 0
            }
          });
        })
        .catch(console.error);
    }, [dateRange]);
    
    if (!userData) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
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
    const [eventData, setEventData] = useState<any>(null);
    
    useEffect(() => {
      adminService.getEventAnalytics(dateRange.startDate, dateRange.endDate, 50)
        .then(response => {
          const data = response.data;
          setEventData({
            eventPerformance: data.eventPerformance || [],
            ticketTypePerformance: data.ticketTypePerformance || []
          });
        })
        .catch(console.error);
    }, [dateRange]);
    
    if (!eventData) {
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
          eventPerformance={eventData.eventPerformance}
          ticketTypePerformance={eventData.ticketTypePerformance}
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

  const datePresets = [
    { id: 'today', label: 'Today', days: 0 },
    { id: '7days', label: 'Last 7 Days', days: 7 },
    { id: '30days', label: 'Last 30 Days', days: 30 },
    { id: '90days', label: 'Last 90 Days', days: 90 },
    { id: 'custom', label: 'Custom Range', days: null },
  ];

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
    setLoading(false);
  }, [user]);

  const handleDatePresetChange = (presetId: string) => {
    const preset = datePresets.find(p => p.id === presetId);
    if (preset && preset.days !== null) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - preset.days);
      
      setDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        preset: presetId
      });
    } else {
      setDateRange(prev => ({ ...prev, preset: presetId }));
    }
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
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
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
