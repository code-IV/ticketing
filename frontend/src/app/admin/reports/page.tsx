'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DollarSign, Calendar, Users, TrendingUp, Download, FileText, BarChart3 } from 'lucide-react';
import { adminService } from '@/services/adminService';
import Link from 'next/link';

interface ReportData {
  revenue: {
    today: string;
    thisWeek: string;
    thisMonth: string;
    growth: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  events: {
    total: number;
    active: number;
    completed: number;
    upcoming: number;
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      window.location.href = '/';
      return;
    }

    fetchReportData();
  }, [user, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from multiple endpoints
      const [dashboardResponse, revenueResponse] = await Promise.all([
        adminService.getDashboardAnalytics(30),
        adminService.getRevenueSummary()
      ]);

      const dashboard = dashboardResponse.data;
      const revenue = revenueResponse.data?.summary || {};

      setReportData({
        revenue: {
          today: revenue?.today || '$0',
          thisWeek: revenue?.thisWeek || '$0',
          thisMonth: revenue?.thisMonth || '$0',
          growth: {
            daily: dashboard?.revenue?.growth?.daily || 0,
            weekly: dashboard?.revenue?.growth?.weekly || 0,
            monthly: dashboard?.revenue?.growth?.monthly || 0
          }
        },
        bookings: {
          total: dashboard?.bookings?.total || 0,
          confirmed: dashboard?.bookings?.confirmed || 0,
          pending: dashboard?.bookings?.pending || 0,
          cancelled: dashboard?.bookings?.cancelled || 0
        },
        events: {
          total: dashboard?.events?.total || 0,
          active: dashboard?.events?.active || 0,
          completed: dashboard?.events?.completed || 0,
          upcoming: dashboard?.events?.upcoming || 0
        },
        users: {
          total: dashboard?.users?.total || 0,
          active: dashboard?.users?.active || 0,
          newThisMonth: dashboard?.users?.newThisMonth || 0
        }
      });
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: 'revenue' | 'bookings' | 'users') => {
    try {
      let data;
      let filename;

      switch (type) {
        case 'revenue':
          const revenueData = await adminService.getDailyRevenue(dateRange.startDate, dateRange.endDate);
          data = revenueData.data;
          filename = `revenue-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
          break;
        case 'bookings':
          const bookingsData = await adminService.getAllBookings(1, 1000);
          data = bookingsData.data;
          filename = `bookings-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
          break;
        case 'users':
          const usersData = await adminService.getAllUsers(1, 1000);
          data = usersData.data;
          filename = `users-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
          break;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map((row: any) => 
            headers.map(header => {
              const value = row[header];
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            }).join(',')
          )
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report. Please try again.');
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
          <p className="text-gray-600 mb-6">You need admin privileges to access reports.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchReportData}>Try Again</Button>
          </div>
        </Card>
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
              <Link href="/admin" className="text-blue-600 hover:text-blue-800 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reportData && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{reportData.revenue.thisMonth}</p>
                      <p className={`text-sm ${reportData.revenue.growth.monthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.revenue.growth.monthly >= 0 ? '+' : ''}{reportData.revenue.growth.monthly}% this month
                      </p>
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
                      <p className="text-2xl font-bold text-gray-900">{reportData.bookings.total}</p>
                      <p className="text-sm text-gray-600">
                        {reportData.bookings.confirmed} confirmed, {reportData.bookings.pending} pending
                      </p>
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
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{reportData.users.total}</p>
                      <p className="text-sm text-gray-600">
                        {reportData.users.newThisMonth} new this month
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Events</p>
                      <p className="text-2xl font-bold text-gray-900">{reportData.events.total}</p>
                      <p className="text-sm text-gray-600">
                        {reportData.events.active} active
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Export Options */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Export Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleExportReport('revenue')}
                    className="flex items-center justify-center"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Revenue Report
                  </Button>
                  <Button
                    onClick={() => handleExportReport('bookings')}
                    className="flex items-center justify-center"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Bookings Report
                  </Button>
                  <Button
                    onClick={() => handleExportReport('users')}
                    className="flex items-center justify-center"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Users Report
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/admin/analytics">
                    <Button variant="secondary" className="w-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/bookings">
                    <Button variant="secondary" className="w-full flex items-center justify-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Manage Bookings
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
