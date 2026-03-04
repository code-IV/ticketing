"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Ticket,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, isWithinInterval } from 'date-fns';
import Link from 'next/link';

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

type Game = {
  id: number;
  name: string;
  status: string;
  totalRevenue: number;
  totalBookings: number;
  avgOccupancy: number;
  eventsCount: number;
};

type Event = {
  id: number;
  name: string;
  game: string;
  date: string;
  status: string;
  revenue: number;
  ticketsSold: number;
  capacity: number;
  occupancy: number;
};

type RevenueData = {
  date: string;
  revenue: number;
};

type TicketsData = {
  date: string;
  ticketsSold: number;
};

// ==================== Mock Data ====================
const mockGames: Game[] = [
  { id: 1, name: 'Cyber Realm', status: 'active', totalRevenue: 85000, totalBookings: 2100, avgOccupancy: 82, eventsCount: 5 },
  { id: 2, name: 'Speed Racer', status: 'maintenance', totalRevenue: 42000, totalBookings: 1100, avgOccupancy: 68, eventsCount: 3 },
  { id: 3, name: 'Fantasy Quest', status: 'active', totalRevenue: 120000, totalBookings: 3200, avgOccupancy: 91, eventsCount: 8 },
  { id: 4, name: 'Space Odyssey', status: 'active', totalRevenue: 65000, totalBookings: 1800, avgOccupancy: 75, eventsCount: 4 },
  { id: 5, name: 'Dragon Warriors', status: 'active', totalRevenue: 95000, totalBookings: 2700, avgOccupancy: 88, eventsCount: 6 },
  { id: 6, name: 'Racing Thunder', status: 'maintenance', totalRevenue: 38000, totalBookings: 950, avgOccupancy: 62, eventsCount: 2 },
];

const mockEvents: Event[] = [
  { id: 101, name: 'Summer Pro League', game: 'Cyber Realm', date: '2026-08-15', status: 'Active', revenue: 12000, ticketsSold: 85, capacity: 100, occupancy: 85 },
  { id: 102, name: 'Midnight Scrims', game: 'Cyber Realm', date: '2026-08-20', status: 'Sold Out', revenue: 18000, ticketsSold: 120, capacity: 120, occupancy: 100 },
  { id: 103, name: 'Newbie Bootcamp', game: 'Fantasy Quest', date: '2026-09-01', status: 'Draft', revenue: 0, ticketsSold: 12, capacity: 50, occupancy: 24 },
  { id: 104, name: 'Pro Tournament', game: 'Speed Racer', date: '2026-08-10', status: 'Active', revenue: 8500, ticketsSold: 42, capacity: 60, occupancy: 70 },
];

// Generate revenue time series (last 30 days)
const generateRevenueTimeSeries = (days = 30): RevenueData[] => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      revenue: Math.floor(Math.random() * 5000) + 2000,
    });
  }
  return data;
};

// Generate tickets time series (last 30 days)
const generateTicketsTimeSeries = (days = 30): TicketsData[] => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      ticketsSold: Math.floor(Math.random() * 150) + 50,
    });
  }
  return data;
};

const mockRevenueTimeSeries = generateRevenueTimeSeries(30);
const mockTicketsTimeSeries = generateTicketsTimeSeries(30);

const revenueByTicketType = [
  { type: 'Adult', revenue: 45000 },
  { type: 'Child', revenue: 28000 },
  { type: 'Senior', revenue: 15000 },
  { type: 'Student', revenue: 22000 },
  { type: 'Group', revenue: 15000 },
];

const revenueByGame = mockGames.map(g => ({ game: g.name, revenue: g.totalRevenue }));

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#ef4444', '#8b5cf6'];

// ==================== Components ====================
const KpiCard = ({ title, value, icon: Icon, change, changeType, isDarkTheme }: {
  title: string;
  value: string;
  icon: any;
  change?: string;
  changeType?: 'positive' | 'negative';
  isDarkTheme: boolean;
}) => (
  <div className={`rounded-xl p-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {change && (
          <p className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${isDarkTheme ? 'bg-indigo-900/20' : 'bg-blue-50'}`}>
        <Icon className={`w-6 h-6 ${isDarkTheme ? 'text-indigo-400' : ''}`} style={{ color: isDarkTheme ? 'var(--accent)' : 'var(--accent)' }} />
      </div>
    </div>
  </div>
);

const DateRangePicker = ({ value, onChange }: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) => {
  const ranges = [
    {
      label: 'Last 7 days',
      start: subDays(new Date(), 7),
      end: new Date(),
    },
    {
      label: 'Last 30 days',
      start: subDays(new Date(), 30),
      end: new Date(),
    },
    {
      label: 'Last 3 months',
      start: subDays(new Date(), 90),
      end: new Date(),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value.label}
        onChange={(e) => {
          const selected = ranges.find(r => r.label === e.target.value);
          if (selected) onChange(selected);
        }}
      >
        {ranges.map(range => (
          <option key={range.label} value={range.label}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ==================== Main Component ====================
export default function AnalyticsDashboardPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    label: 'Last 30 days',
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  // Filter data based on date range
  const filterDataByDateRange = (data: RevenueData[] | TicketsData[], range: DateRange) => {
    if (!range.start || !range.end) return data;
    return data.filter(d => {
      const date = new Date(d.date);
      return isWithinInterval(date, { start: range.start, end: range.end });
    });
  };

  const filteredRevenueSeries = filterDataByDateRange(mockRevenueTimeSeries, dateRange);
  const filteredTicketsSeries = filterDataByDateRange(mockTicketsTimeSeries, dateRange);

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with title and date picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Analytics Dashboard</h1>
          <div className="flex items-center gap-2">
            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkTheme 
                  ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
              style={{ color: isDarkTheme ? 'white' : '#111827' }}
              value={dateRange.label}
              onChange={(e) => {
                const ranges = [
                  { label: 'Last 7 days', start: subDays(new Date(), 7), end: new Date() },
                  { label: 'Last 30 days', start: subDays(new Date(), 30), end: new Date() },
                  { label: 'Last 3 months', start: subDays(new Date(), 90), end: new Date() },
                ];
                const selected = ranges.find(r => r.label === e.target.value);
                if (selected) setDateRange(selected);
              }}
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 3 months">Last 3 months</option>
            </select>
          </div>
        </div>

        {/* Navigation Links */}
        <div className={`rounded-xl p-4 mb-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-wrap gap-4">
            <Link href="/analitics/revenue" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Revenue Analytics
            </Link>
            <Link href="/analitics/games" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Games Analytics
            </Link>
            <Link href="/analitics/events" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Events Analytics
            </Link>
            <Link href="/analitics/bookings" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Booking Analytics
            </Link>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard title="Total Revenue" value="$247,000" icon={DollarSign} isDarkTheme={isDarkTheme} />
            <KpiCard title="Total Tickets Sold" value="8,250" icon={Ticket} isDarkTheme={isDarkTheme} />
            <KpiCard title="Active Games" value="2" icon={Activity} isDarkTheme={isDarkTheme} />
          </div>

          {/* Financial Analytics Section */}
          <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Financial Analytics</h2>
              <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Revenue trends and performance by game</p>
            </div>
            <div className="p-6 space-y-6">
              <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredRevenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#93c5fd" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Top Games by Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByGame}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Ticket Sales Analytics Section */}
          <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Ticket Sales Analytics</h2>
              <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total tickets sold over time</p>
            </div>
            <div className="p-6">
              <div className={`rounded-xl p-4 ${isDarkTheme ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Total Tickets Sold</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredTicketsSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="ticketsSold" stroke="#10b981" fill="#86efac" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Events Section */}
          <div className={`rounded-xl overflow-hidden ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b ${isDarkTheme ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'}`}>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Recent Events</h2>
              <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Latest event activities and performance</p>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead className={`${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-4 py-2 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Event</th>
                    <th className={`px-4 py-2 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Game</th>
                    <th className={`px-4 py-2 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Date</th>
                    <th className={`px-4 py-2 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Occupancy</th>
                    <th className={`px-4 py-2 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {mockEvents.slice(0, 3).map(event => (
                    <tr key={event.id} className={`cursor-pointer border-t hover:${isDarkTheme ? 'bg-gray-800' : 'bg-gray-50'} ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`} onClick={() => router.push(`/analitics/events/${event.id}`)}>
                      <td className={`px-4 py-2 font-medium ${isDarkTheme ? 'text-white' : ''}`}>{event.name}</td>
                      <td className={`px-4 py-2 ${isDarkTheme ? 'text-gray-300' : ''}`}>{event.game}</td>
                      <td className={`px-4 py-2 ${isDarkTheme ? 'text-gray-300' : ''}`}>{event.date}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-16 rounded-full h-2 ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div className="bg-accent h-2 rounded-full" style={{ width: `${event.occupancy}%` }} />
                          </div>
                          <span className={`${isDarkTheme ? 'text-gray-300' : ''}`}>{event.occupancy}%</span>
                        </div>
                      </td>
                      <td className={`px-4 py-2 ${isDarkTheme ? 'text-gray-300' : ''}`}>${event.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}