"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Ticket,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { format, subDays, isWithinInterval } from 'date-fns';

// ==================== Types ====================
type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

// ==================== Types ====================
type BookingData = {
  date: string;
  tickets: number;
  revenue: number;
};

type GameBookingData = {
  game: string;
  tickets: number;
  revenue: number;
  sessions: number;
};

type TopGameData = {
  game: string;
  tickets: number;
  revenue: number;
  topTicketType: string;
  topTicketPrice: number;
  topTicketSold: number;
};

type EventBookingData = {
  event: string;
  booked: number;
  capacity: number;
  occupancy: number;
  revenue: number;
};

// ==================== Mock Data ====================
const generateBookingTimeSeries = (days = 30): BookingData[] => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const baseTickets = 150;
    const variation = Math.floor(Math.random() * 100) - 50;
    const tickets = Math.max(50, baseTickets + variation);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      tickets,
      revenue: tickets * 45, // Average ticket price
    });
  }
  return data;
};

const mockBookingTimeSeries = generateBookingTimeSeries(30);

const gameBookingData: GameBookingData[] = [
  { game: 'Cyber Realm', tickets: 2100, revenue: 85000, sessions: 420 },
  { game: 'Speed Racer', tickets: 1100, revenue: 42000, sessions: 220 },
  { game: 'Fantasy Quest', tickets: 3200, revenue: 120000, sessions: 640 },
  { game: 'Virtual Reality', tickets: 1800, revenue: 65000, sessions: 360 },
  { game: 'Laser Tag', tickets: 2400, revenue: 88000, sessions: 480 },
];

// Event data only for the Event Booking vs Capacity section
const eventBookingData: EventBookingData[] = [
  { event: 'Summer Pro League', booked: 85, capacity: 100, occupancy: 85, revenue: 12000 },
  { event: 'Midnight Scrims', booked: 120, capacity: 120, occupancy: 100, revenue: 18000 },
  { event: 'Newbie Bootcamp', booked: 12, capacity: 50, occupancy: 24, revenue: 0 },
  { event: 'Pro Tournament', booked: 42, capacity: 60, occupancy: 70, revenue: 8500 },
  { event: 'Weekend Special', booked: 95, capacity: 100, occupancy: 95, revenue: 14000 },
  { event: 'Championship Finals', booked: 150, capacity: 150, occupancy: 100, revenue: 25000 },
];

const topGamesData: TopGameData[] = [
  { game: 'Fantasy Quest', tickets: 3200, revenue: 120000, topTicketType: 'VIP Pass', topTicketPrice: 150, topTicketSold: 800 },
  { game: 'Cyber Realm', tickets: 2100, revenue: 85000, topTicketType: 'Premium Session', topTicketPrice: 85, topTicketSold: 600 },
  { game: 'Laser Tag', tickets: 2400, revenue: 88000, topTicketType: 'Team Battle', topTicketPrice: 75, topTicketSold: 720 },
  { game: 'Virtual Reality', tickets: 1800, revenue: 65000, topTicketType: 'VR Experience', topTicketPrice: 90, topTicketSold: 450 },
  { game: 'Speed Racer', tickets: 1100, revenue: 42000, topTicketType: 'Racing Package', topTicketPrice: 65, topTicketSold: 320 },
];

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
        <Icon className={`w-6 h-6 ${isDarkTheme ? 'text-indigo-400' : ''}`} style={{ color: 'var(--accent)' }} />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function BookingAnalyticsPage() {
  const { isDarkTheme } = useTheme();
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    label: 'Last 7 days',
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  // Filter data based on date range
  const filterDataByDateRange = (data: BookingData[], range: DateRange) => {
    if (!range.start || !range.end) return data;
    return data.filter(d => {
      const date = new Date(d.date);
      return range.start && range.end && isWithinInterval(date, { start: range.start as Date, end: range.end as Date });
    });
  };

  const filteredBookingSeries = filterDataByDateRange(mockBookingTimeSeries, dateRange);

  // Calculate KPIs
  const totalBookings = filteredBookingSeries.reduce((sum, day) => sum + day.tickets, 0);
  const avgDailyBookings = Math.round(totalBookings / filteredBookingSeries.length);
  const peakDay = filteredBookingSeries.reduce((max, day) => 
    day.tickets > max.tickets ? day : max, filteredBookingSeries[0] || { tickets: 0 }
  );
  const totalRevenue = filteredBookingSeries.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with title and date picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Booking Analytics</h1>
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

        {/* Back Navigation */}
        <button
          onClick={() => router.push('/analitics')}
          className={`flex items-center gap-2 text-sm mb-6 ${isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          ← Back to Analytics Dashboard
        </button>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard title="Total Tickets Sold" value={totalBookings.toLocaleString()} icon={Ticket} isDarkTheme={isDarkTheme} />
          <KpiCard title="Avg Daily Bookings" value={avgDailyBookings.toLocaleString()} icon={Activity} isDarkTheme={isDarkTheme} />
          <KpiCard 
            title="Peak Day" 
            value={`${peakDay.tickets} tickets`} 
            icon={TrendingUp}
            change={format(new Date(peakDay.date), 'MMM dd')}
            changeType="positive"
            isDarkTheme={isDarkTheme}
          />
          <KpiCard title="Revenue from Bookings" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} isDarkTheme={isDarkTheme} />
        </div>

        {/* Total Tickets Bought Graph */}
        <div className={`rounded-xl p-6 mb-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Total Tickets Bought Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredBookingSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date as string), 'MMM dd, yyyy')}
                formatter={(value: any) => [`${value} tickets`, 'Tickets Sold']}
              />
              <Line 
                type="monotone" 
                dataKey="tickets" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event Booking with Occupancy Graphs */}
        <div className={`rounded-xl p-6 mb-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Event Booking vs Capacity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={eventBookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
              <Bar dataKey="booked" fill="#3b82f6" name="Booked" />
              <Line 
                type="monotone" 
                dataKey="occupancy" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Occupancy %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {/* Summary Table */}
        <div className={`rounded-xl p-6 mt-6 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Booking Summary by Game (Descending Order)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-4 py-3 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Rank</th>
                  <th className={`px-4 py-3 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Game</th>
                  <th className={`px-4 py-3 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Total Tickets Sold</th>
                  <th className={`px-4 py-3 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Revenue</th>
                  <th className={`px-4 py-3 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Ticket Type</th>
                  <th className={`px-4 py-3 text-left ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>Ticket Price</th>
                </tr>
              </thead>
              <tbody>
                {topGamesData
                  .sort((a, b) => b.tickets - a.tickets)
                  .map((game, index) => (
                  <tr key={index} className={`border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className="px-4 py-3 font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        index === 0 
                          ? (isDarkTheme ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800') 
                          : index === 1 
                          ? (isDarkTheme ? 'bg-gray-900/20 text-gray-400' : 'bg-gray-100 text-gray-800') 
                          : index === 2 
                          ? (isDarkTheme ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-100 text-orange-800') 
                          : (isDarkTheme ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700')
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${isDarkTheme ? 'text-white' : ''}`}>{game.game}</td>
                    <td className={`px-4 py-3 font-bold text-accent`}>{game.tickets.toLocaleString()}</td>
                    <td className={`px-4 py-3 font-medium ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>${game.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkTheme ? 'bg-accent/20 text-accent' : 'bg-accent/20 text-accent'}`}>
                        {game.topTicketType}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${isDarkTheme ? 'text-gray-300' : ''}`}>${game.topTicketPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
