"use client";
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Plus,
  Settings,
  BarChart3,
  Ticket,
  MapPin,
  Star,
  Zap,
  Shield,
  Sparkles,
  Target,
  Rocket,
  Crown
} from 'lucide-react';

export default function AdminDashboard() {
  const { isDarkTheme } = useTheme();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayBookings: 0,
    activeEvents: 0,
    totalUsers: 0,
    occupancyRate: 0,
    avgRating: 0,
    pendingIssues: 0,
    systemHealth: 100
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    // Simulate loading dashboard data
    setStats({
      totalRevenue: 2456789,
      todayBookings: 342,
      activeEvents: 8,
      totalUsers: 12847,
      occupancyRate: 78,
      avgRating: 4.6,
      pendingIssues: 3,
      systemHealth: 98
    });

    setRecentActivity([
      { id: 1, action: 'New booking', details: 'Thunder Coaster - 4 tickets', time: '2 mins ago', type: 'success' },
      { id: 2, action: 'Event created', details: 'Summer Festival 2024', time: '15 mins ago', type: 'info' },
      { id: 3, action: 'Payment received', details: 'ETB 2,450', time: '1 hour ago', type: 'success' },
      { id: 4, action: 'System alert', details: 'High traffic detected', time: '2 hours ago', type: 'warning' },
      { id: 5, action: 'User registered', details: 'john@example.com', time: '3 hours ago', type: 'info' }
    ]);

    setTopPerformers([
      { name: 'Thunder Coaster', revenue: 456789, bookings: 1234, rating: 4.8 },
      { name: 'Splash Mountain', revenue: 345678, bookings: 987, rating: 4.7 },
      { name: 'Haunted Mansion', revenue: 234567, bookings: 756, rating: 4.9 }
    ]);

    setUpcomingEvents([
      { name: 'Summer Festival', date: '2024-07-15', attendees: 450, capacity: 500 },
      { name: 'Concert Night', date: '2024-07-18', attendees: 320, capacity: 400 },
      { name: 'Food Expo', date: '2024-07-20', attendees: 180, capacity: 200 }
    ]);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl ${
          isDarkTheme ? 'bg-indigo-600' : 'bg-gradient-to-r from-indigo-400 to-purple-400'
        } animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl ${
          isDarkTheme ? 'bg-purple-600' : 'bg-gradient-to-r from-purple-400 to-pink-400'
        } animate-pulse`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl ${
          isDarkTheme ? 'bg-blue-600' : 'bg-gradient-to-r from-blue-400 to-cyan-400'
        } animate-pulse`} />
      </div>

      <div className="relative z-10 p-2 sm:p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
              isDarkTheme 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}>
              <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight mb-1 sm:mb-2 bg-gradient-to-r ${
                isDarkTheme 
                  ? 'from-white via-gray-200 to-gray-400' 
                  : 'from-slate-900 via-indigo-800 to-purple-800'
              } bg-clip-text text-transparent`}>
                Admin Dashboard
              </h1>
              <p className={`text-sm sm:text-base lg:text-lg font-medium ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Welcome back! Here's what's happening in your park today.
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sm:mb-12">
          {[
            {
              label: 'Total Revenue',
              value: formatCurrency(stats.totalRevenue),
              change: '+12.5%',
              trend: 'up',
              icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
              color: 'text-emerald-600',
              bgColor: isDarkTheme ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' : 'bg-gradient-to-br from-emerald-50 to-emerald-100',
              borderColor: isDarkTheme ? 'border-emerald-500/30' : 'border-emerald-200',
              shineColor: 'from-emerald-400/20 to-transparent'
            },
            {
              label: 'Today\'s Bookings',
              value: stats.todayBookings.toString(),
              change: '+8.2%',
              trend: 'up',
              icon: <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />,
              color: 'text-blue-600',
              bgColor: isDarkTheme ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-br from-blue-50 to-blue-100',
              borderColor: isDarkTheme ? 'border-blue-500/30' : 'border-blue-200',
              shineColor: 'from-blue-400/20 to-transparent'
            },
            {
              label: 'Active Events',
              value: stats.activeEvents.toString(),
              change: '+2',
              trend: 'up',
              icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />,
              color: 'text-purple-600',
              bgColor: isDarkTheme ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10' : 'bg-gradient-to-br from-purple-50 to-purple-100',
              borderColor: isDarkTheme ? 'border-purple-500/30' : 'border-purple-200',
              shineColor: 'from-purple-400/20 to-transparent'
            },
            {
              label: 'Total Users',
              value: stats.totalUsers.toLocaleString(),
              change: '+5.4%',
              trend: 'up',
              icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
              color: 'text-orange-600',
              bgColor: isDarkTheme ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10' : 'bg-gradient-to-br from-orange-50 to-orange-100',
              borderColor: isDarkTheme ? 'border-orange-500/30' : 'border-orange-200',
              shineColor: 'from-orange-400/20 to-transparent'
            }
          ].map((metric, index) => (
            <div
              key={index}
              className={`group relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden ${
                metric.bgColor
              } ${metric.borderColor} ${
                isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'
              }`}
            >
              {/* Shine Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${metric.shineColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${
                    isDarkTheme 
                      ? 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm' 
                      : 'bg-white shadow-lg'
                  }`}>
                    <div className={metric.color}>
                      {metric.icon}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold ${
                    metric.trend === 'up' 
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' 
                      : 'bg-red-500/20 text-red-600 border border-red-500/30'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                    <span className="hidden sm:inline">{metric.change}</span>
                    <span className="sm:hidden">+{metric.change.split('%')[0]}%</span>
                  </div>
                </div>
                <div className={`text-2xl sm:text-4xl font-black mb-1 sm:mb-2 bg-gradient-to-r ${
                  isDarkTheme 
                    ? 'from-white to-gray-300' 
                    : 'from-slate-900 to-slate-700'
                } bg-clip-text text-transparent`}>
                  {metric.value}
                </div>
                <div className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  isDarkTheme ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  {metric.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className={`group relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden mb-6 sm:mb-12 ${
          isDarkTheme 
            ? 'bg-gradient-to-br from-[#0A0A0A] to-gray-900 border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border-slate-200'
        }`}>
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
                isDarkTheme 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}>
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className={`text-lg sm:text-2xl font-black bg-gradient-to-r ${
                isDarkTheme 
                  ? 'from-white to-gray-300' 
                  : 'from-slate-900 to-slate-700'
              } bg-clip-text text-transparent`}>
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { href: '/admin/games', label: 'Add New Game', icon: <Plus className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'emerald' },
                { href: '/admin/events', label: 'Create Event', icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'blue' },
                { href: '/admin/user', label: 'Manage Users', icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'purple' },
                { href: '/admin/analitics/bookings', label: 'View Analytics', icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'orange' }
              ].map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className={`group/action flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isDarkTheme 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 group-hover/action:scale-110 ${
                    action.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-600' :
                    action.color === 'blue' ? 'bg-blue-500/20 text-blue-600' :
                    action.color === 'purple' ? 'bg-purple-500/20 text-purple-600' :
                    'bg-orange-500/20 text-orange-600'
                  }`}>
                    {action.icon}
                  </div>
                  <span className="font-bold text-sm sm:text-lg flex-1 text-center sm:text-left">{action.label}</span>
                  <div className="opacity-0 group-hover/action:opacity-100 group-hover/action:translate-x-1 transition-all duration-300 hidden sm:block">
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers & Recent Activity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Top Performing Games */}
          <div
            className={`group relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden ${
              isDarkTheme 
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30' 
                : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
            } ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'}`}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${
                  isDarkTheme 
                    ? 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm' 
                    : 'bg-white shadow-lg'
                }`}>
                  <div className="text-amber-600">
                    <Target className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30`}>
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Top 3</span>
                  <span className="sm:hidden">3</span>
                </div>
              </div>
              
              <div className={`text-xl sm:text-3xl font-black mb-1 sm:mb-2 bg-gradient-to-r ${
                isDarkTheme 
                  ? 'from-white to-gray-300' 
                  : 'from-slate-900 to-slate-700'
              } bg-clip-text text-transparent`}>
                {formatCurrency(topPerformers.reduce((sum, p) => sum + p.revenue, 0))}
              </div>
              <div className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6 ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Total Revenue
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-102">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-black text-[10px] sm:text-xs ${
                        index === 0 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                          : index === 1 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-medium truncate max-w-[80px] sm:max-w-none ${
                        isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        {performer.name}
                      </span>
                    </div>
                    <span className={`text-[10px] sm:text-xs font-bold ${
                      isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                    }`}>
                      {formatCurrency(performer.revenue).split('.')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className={`group relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden ${
              isDarkTheme 
                ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            } ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'}`}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${
                  isDarkTheme 
                    ? 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm' 
                    : 'bg-white shadow-lg'
                }`}>
                  <div className="text-blue-600">
                    <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-blue-500/20 text-blue-600 border border-blue-500/30`}>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Live</span>
                  <span className="sm:hidden">🔴</span>
                </div>
              </div>
              
              <div className={`text-xl sm:text-3xl font-black mb-1 sm:mb-2 bg-gradient-to-r ${
                isDarkTheme 
                  ? 'from-white to-gray-300' 
                  : 'from-slate-900 to-slate-700'
              } bg-clip-text text-transparent`}>
                {recentActivity.length}
              </div>
              <div className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6 ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Recent Activities
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                {recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-102">
                    <div className={`p-1 sm:p-1.5 rounded-full ${
                      activity.type === 'success' ? 'bg-emerald-500/20 text-emerald-600' :
                      activity.type === 'warning' ? 'bg-amber-500/20 text-amber-600' :
                      'bg-blue-500/20 text-blue-600'
                    }`}>
                      {activity.type === 'success' ? <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> :
                       activity.type === 'warning' ? <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> :
                       <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] sm:text-xs font-medium truncate ${
                        isDarkTheme ? 'text-white' : 'text-slate-900'
                      }`}>
                        {activity.action}
                      </p>
                      <p className={`text-[9px] sm:text-xs ${
                        isDarkTheme ? 'text-gray-500' : 'text-slate-500'
                      }`}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className={`group relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden ${
          isDarkTheme 
            ? 'bg-gradient-to-br from-[#0A0A0A] to-gray-900 border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border-slate-200'
        }`}>
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
                  isDarkTheme 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className={`text-lg sm:text-2xl font-black bg-gradient-to-r ${
                  isDarkTheme 
                    ? 'from-white to-gray-300' 
                    : 'from-slate-900 to-slate-700'
                } bg-clip-text text-transparent`}>
                  Upcoming Events
                </h3>
              </div>
              <Link
                href="/admin/events"
                className={`group/link flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base ${
                  isDarkTheme 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                }`}
              >
                <span>View All</span>
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 rotate-45 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all duration-300" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {upcomingEvents.map((event, index) => (
                <div
                  key={index}
                  className={`group/event p-3 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isDarkTheme 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${
                      isDarkTheme ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className={`font-bold text-sm sm:text-lg ${
                      isDarkTheme ? 'text-white' : 'text-slate-900'
                    }`}>
                      {event.name}
                    </h4>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <p className={`text-xs sm:text-sm font-medium ${
                      isDarkTheme ? 'text-gray-400' : 'text-slate-600'
                    }`}>
                      {event.date}
                    </p>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${
                          isDarkTheme ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          Attendance
                        </span>
                        <span className={`text-xs sm:text-sm font-bold ${
                          isDarkTheme ? 'text-white' : 'text-slate-900'
                        }`}>
                          {event.attendees}/{event.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 group-hover/event:from-purple-600 group-hover/event:to-pink-600"
                          style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}