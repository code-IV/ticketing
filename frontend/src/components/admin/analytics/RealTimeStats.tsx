import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { DollarSign, Calendar, Users, Activity, TrendingUp, RefreshCw } from 'lucide-react';

interface RealTimeStatsProps {
  initialData?: {
    revenue: string;
    bookings: number;
    users: number;
    events: number;
  };
  refreshInterval?: number; // in seconds
}

export function RealTimeStats({ 
  initialData = { revenue: '0', bookings: 0, users: 0, events: 0 },
  refreshInterval = 30 
}: RealTimeStatsProps) {
  const [stats, setStats] = useState(initialData);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousStats, setPreviousStats] = useState(initialData);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      fetchRealTimeStats();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchRealTimeStats = async () => {
    setIsRefreshing(true);
    
    try {
      // In a real implementation, this would fetch from your analytics API
      // For now, we'll simulate some realistic changes
      const simulatedData = {
        revenue: (parseFloat(stats.revenue) + (Math.random() - 0.5) * 100).toFixed(2),
        bookings: Math.max(0, stats.bookings + Math.floor(Math.random() * 3) - 1),
        users: Math.max(0, stats.users + Math.floor(Math.random() * 2)),
        events: Math.max(0, stats.events + Math.floor(Math.random() * 2) - 1)
      };

      setStats(simulatedData);
      setPreviousStats(stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = current - previous;
    if (change === 0) return null;
    return {
      value: Math.abs(change),
      isPositive: change > 0,
      percentage: previous !== 0 ? Math.abs((change / previous) * 100) : 0
    };
  };

  const revenueChange = getChangeIndicator(parseFloat(stats.revenue), parseFloat(previousStats.revenue));
  const bookingsChange = getChangeIndicator(stats.bookings, previousStats.bookings);
  const usersChange = getChangeIndicator(stats.users, previousStats.users);
  const eventsChange = getChangeIndicator(stats.events, previousStats.events);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Real-Time Statistics</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Last updated: {formatTimeAgo(lastUpdate)}
          </div>
          <button
            onClick={fetchRealTimeStats}
            disabled={isRefreshing}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Today's Revenue</span>
              </div>
              {revenueChange && (
                <div className={`flex items-center text-xs font-medium ${
                  revenueChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    !revenueChange.isPositive ? 'rotate-180' : ''
                  }`} />
                  {revenueChange.percentage.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${parseFloat(stats.revenue).toLocaleString()}
            </div>
            {revenueChange && (
              <div className="text-xs text-gray-500 mt-1">
                {revenueChange.isPositive ? '+' : '-'}${revenueChange.value.toFixed(2)} from yesterday
              </div>
            )}
          </div>
        </Card>

        {/* Bookings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Active Bookings</span>
              </div>
              {bookingsChange && (
                <div className={`flex items-center text-xs font-medium ${
                  bookingsChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    !bookingsChange.isPositive ? 'rotate-180' : ''
                  }`} />
                  {bookingsChange.percentage.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.bookings.toLocaleString()}
            </div>
            {bookingsChange && (
              <div className="text-xs text-gray-500 mt-1">
                {bookingsChange.isPositive ? '+' : '-'}{bookingsChange.value} from last hour
              </div>
            )}
          </div>
        </Card>

        {/* Users */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Online Users</span>
              </div>
              {usersChange && (
                <div className={`flex items-center text-xs font-medium ${
                  usersChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    !usersChange.isPositive ? 'rotate-180' : ''
                  }`} />
                  {usersChange.percentage.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.users.toLocaleString()}
            </div>
            {usersChange && (
              <div className="text-xs text-gray-500 mt-1">
                {usersChange.isPositive ? '+' : '-'}{usersChange.value} from last hour
              </div>
            )}
          </div>
        </Card>

        {/* Events */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Live Events</span>
              </div>
              {eventsChange && (
                <div className={`flex items-center text-xs font-medium ${
                  eventsChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    !eventsChange.isPositive ? 'rotate-180' : ''
                  }`} />
                  {eventsChange.percentage.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.events.toLocaleString()}
            </div>
            {eventsChange && (
              <div className="text-xs text-gray-500 mt-1">
                {eventsChange.isPositive ? '+' : '-'}{eventsChange.value} from yesterday
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Status Indicator */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
          <div className="text-sm text-blue-800">
            <span className="font-medium">Live Data</span> - Statistics update automatically every {refreshInterval} seconds
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">New booking received</span>
              <span className="text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Payment completed</span>
              <span className="text-gray-500">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">New user registration</span>
              <span className="text-gray-500">8 minutes ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Event capacity reached</span>
              <span className="text-gray-500">12 minutes ago</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
