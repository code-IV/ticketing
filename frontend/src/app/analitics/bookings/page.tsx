"use client";

import { useState } from 'react';
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
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader';
import { DateRange } from '@/components/analytics/DateRangePicker';

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
const KpiCard = ({ title, value, icon: Icon, change, changeType }: {
  title: string;
  value: string;
  icon: any;
  change?: string;
  changeType?: 'positive' | 'negative';
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 style={{ color: 'var(--accent)' }}" />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function BookingAnalyticsPage() {
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
      return isWithinInterval(date, { start: range.start, end: range.end });
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <AnalyticsHeader 
          title="Booking Analytics" 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard title="Total Tickets Sold" value={totalBookings.toLocaleString()} icon={Ticket} />
          <KpiCard title="Avg Daily Bookings" value={avgDailyBookings.toLocaleString()} icon={Activity} />
          <KpiCard 
            title="Peak Day" 
            value={`${peakDay.tickets} tickets`} 
            icon={TrendingUp}
            change={format(new Date(peakDay.date), 'MMM dd')}
            changeType="positive"
          />
          <KpiCard title="Revenue from Bookings" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        </div>

        {/* Total Tickets Bought Graph */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Tickets Bought Over Time</h3>
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Booking vs Capacity</h3>
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary by Game (Descending Order)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Game</th>
                  <th className="px-4 py-3 text-left">Total Tickets Sold</th>
                  <th className="px-4 py-3 text-left">Revenue</th>
                  <th className="px-4 py-3 text-left">Ticket Type</th>
                  <th className="px-4 py-3 text-left">Ticket Price</th>
                </tr>
              </thead>
              <tbody>
                {topGamesData
                  .sort((a, b) => b.tickets - a.tickets)
                  .map((game, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{game.game}</td>
                    <td className="px-4 py-3 font-bold text-accent">{game.tickets.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-green-600">${game.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                        {game.topTicketType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">${game.topTicketPrice}</td>
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
