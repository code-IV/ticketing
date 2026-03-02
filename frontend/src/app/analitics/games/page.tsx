"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Ticket,
  DollarSign,
  PieChart,
  ChevronLeft,
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
} from 'recharts';
import { format, subDays, isWithinInterval } from 'date-fns';
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader';
import { DateRange } from '@/components/analytics/DateRangePicker';

// ==================== Types ====================
type Game = {
  id: number;
  name: string;
  status: string;
  totalRevenue: number;
  totalBookings: number;
  avgOccupancy: number;
  eventsCount: number;
  ticketsSold: number;
  topTicketType: string;
  topTicketPrice: number;
  topTicketSold: number;
};

type TicketTypeData = {
  type: string;
  sold: number;
  revenue: number;
  avgPrice: number;
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

type BookingData = {
  date: string;
  bookings: number;
};

// ==================== Mock Data ====================
const mockGames: Game[] = [
  { id: 1, name: 'Cyber Realm', status: 'active', totalRevenue: 85000, totalBookings: 2100, avgOccupancy: 82, eventsCount: 5, ticketsSold: 2100, topTicketType: 'Premium Session', topTicketPrice: 85, topTicketSold: 600 },
  { id: 2, name: 'Speed Racer', status: 'maintenance', totalRevenue: 42000, totalBookings: 1100, avgOccupancy: 68, eventsCount: 3, ticketsSold: 1100, topTicketType: 'Racing Package', topTicketPrice: 65, topTicketSold: 320 },
  { id: 3, name: 'Fantasy Quest', status: 'active', totalRevenue: 120000, totalBookings: 3200, avgOccupancy: 91, eventsCount: 8, ticketsSold: 3200, topTicketType: 'VIP Pass', topTicketPrice: 150, topTicketSold: 800 },
];

const mockEvents: Event[] = [
  { id: 101, name: 'Summer Pro League', game: 'Cyber Realm', date: '2026-08-15', status: 'Active', revenue: 12000, ticketsSold: 85, capacity: 100, occupancy: 85 },
  { id: 102, name: 'Midnight Scrims', game: 'Cyber Realm', date: '2026-08-20', status: 'Sold Out', revenue: 18000, ticketsSold: 120, capacity: 120, occupancy: 100 },
  { id: 103, name: 'Newbie Bootcamp', game: 'Fantasy Quest', date: '2026-09-01', status: 'Draft', revenue: 0, ticketsSold: 12, capacity: 50, occupancy: 24 },
  { id: 104, name: 'Pro Tournament', game: 'Speed Racer', date: '2026-08-10', status: 'Active', revenue: 8500, ticketsSold: 42, capacity: 60, occupancy: 70 },
];

const getGameRevenueSeries = (gameId: number, dateRange: DateRange): RevenueData[] => {
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const base = gameId * 1000;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: format(date, 'yyyy-MM-dd'),
      revenue: base + Math.floor(Math.random() * 3000) + 1000,
    };
  });
};

const getGameBookingsSeries = (gameId: number, dateRange: DateRange): BookingData[] => {
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const base = gameId * 50;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: format(date, 'yyyy-MM-dd'),
      bookings: base + Math.floor(Math.random() * 100) + 20,
    };
  });
};

const revenueByGame = mockGames.map(g => ({ game: g.name, revenue: g.totalRevenue }));
const ticketsSoldByGame = mockGames.map(g => ({ game: g.name, tickets: g.ticketsSold }));

const getTicketTypeData = (gameId: number): TicketTypeData[] => {
  // Base ticket types for all games
  const baseTicketTypes = [
    { type: 'Adult', sold: 400, revenue: 32000, avgPrice: 80 },
    { type: 'Child', sold: 250, revenue: 15000, avgPrice: 60 },
    { type: 'Senior', sold: 150, revenue: 9000, avgPrice: 60 },
    { type: 'Group', sold: 100, revenue: 5000, avgPrice: 50 },
  ];
  
  if (gameId === 1) { // Cyber Realm
    return [
      { type: 'Adult', sold: 600, revenue: 48000, avgPrice: 80 },
      { type: 'Child', sold: 400, revenue: 24000, avgPrice: 60 },
      { type: 'Senior', sold: 300, revenue: 18000, avgPrice: 60 },
      { type: 'Group', sold: 200, revenue: 10000, avgPrice: 50 },
    ];
  } else if (gameId === 2) { // Speed Racer
    return [
      { type: 'Adult', sold: 350, revenue: 24500, avgPrice: 70 },
      { type: 'Child', sold: 280, revenue: 16800, avgPrice: 60 },
      { type: 'Senior', sold: 200, revenue: 12000, avgPrice: 60 },
      { type: 'Group', sold: 150, revenue: 7500, avgPrice: 50 },
    ];
  } else if (gameId === 3) { // Fantasy Quest
    return [
      { type: 'Adult', sold: 800, revenue: 80000, avgPrice: 100 },
      { type: 'Child', sold: 500, revenue: 35000, avgPrice: 70 },
      { type: 'Senior', sold: 350, revenue: 24500, avgPrice: 70 },
      { type: 'Group', sold: 250, revenue: 15000, avgPrice: 60 },
    ];
  }
  
  return baseTicketTypes;
};

// ==================== Components ====================
const KpiCard = ({ title, value, icon: Icon }: {
  title: string;
  value: string | number;
  icon: any;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function GamesAnalyticsPage() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    label: 'Last 7 days',
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  if (selectedGame) {
    // Drill-down view for a specific game
    const gameEvents = mockEvents.filter(e => e.game === selectedGame.name);
    const gameRevenueSeries = getGameRevenueSeries(selectedGame.id, dateRange);
    const gameBookingsSeries = getGameBookingsSeries(selectedGame.id, dateRange);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <button
              onClick={() => setSelectedGame(null)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={16} /> Back to Games
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{selectedGame.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KpiCard title="Total Revenue" value={`$${selectedGame.totalRevenue}`} icon={DollarSign} />
              <KpiCard title="Total Tickets Sold" value={selectedGame.totalBookings} icon={Ticket} />
            </div>

            {/* Charts for this game */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend ({dateRange.label})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gameRevenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Bookings Trend ({dateRange.label})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gameBookingsSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#f97316" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ticket Type Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Revenue by Ticket Type ({dateRange.label})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={getTicketTypeData(selectedGame.id)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.type}: $${entry.revenue.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {getTicketTypeData(selectedGame.id).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Bookings by Ticket Type ({dateRange.label})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={getTicketTypeData(selectedGame.id)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.type}: ${entry.sold} tickets`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sold"
                    >
                      {getTicketTypeData(selectedGame.id).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#f97316', '#ef4444', '#10b981', '#3b82f6'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Ticket Types for {selectedGame.name}</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Type of Ticket</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Amount Sold</th>
                    <th className="px-4 py-2 text-left">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {getTicketTypeData(selectedGame.id).map((ticket, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium">{ticket.type}</td>
                      <td className="px-4 py-2">${ticket.avgPrice}</td>
                      <td className="px-4 py-2">{ticket.sold}</td>
                      <td className="px-4 py-2">${ticket.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Main games list with a chart above the table
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <AnalyticsHeader 
              title="Games Analytics" 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange} 
            />
            {/* Revenue by Game Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue by Game</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByGame}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="game" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tickets Sold by Game Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">Tickets Sold by Game</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ticketsSoldByGame}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="game" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Games Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Game</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Total Revenue</th>
                    <th className="px-4 py-3 text-left">Total Bookings</th>
                    <th className="px-4 py-3 text-left">Avg Occupancy</th>
                    <th className="px-4 py-3 text-left">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {mockGames.map(game => (
                    <tr
                      key={game.id}
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedGame(game)}
                    >
                      <td className="px-4 py-3 font-medium">{game.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          game.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {game.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">${game.totalRevenue.toLocaleString()}</td>
                      <td className="px-4 py-3">{game.totalBookings.toLocaleString()}</td>
                      <td className="px-4 py-3">{game.avgOccupancy}%</td>
                      <td className="px-4 py-3">{game.eventsCount}</td>
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
}
