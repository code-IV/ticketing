"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Ticket,
  DollarSign,
  PieChart,
} from 'lucide-react';
import {
  LineChart,
  Line,
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

type BookingData = {
  date: string;
  bookings: number;
};

// ==================== Mock Data ====================
const mockEvents: Event[] = [
  { id: 101, name: 'Summer Pro League', game: 'Cyber Realm', date: '2026-08-15', status: 'Active', revenue: 12000, ticketsSold: 85, capacity: 100, occupancy: 85 },
  { id: 102, name: 'Midnight Scrims', game: 'Cyber Realm', date: '2026-08-20', status: 'Sold Out', revenue: 18000, ticketsSold: 120, capacity: 120, occupancy: 100 },
  { id: 103, name: 'Newbie Bootcamp', game: 'Fantasy Quest', date: '2026-09-01', status: 'Draft', revenue: 0, ticketsSold: 12, capacity: 50, occupancy: 24 },
  { id: 104, name: 'Pro Tournament', game: 'Speed Racer', date: '2026-08-10', status: 'Active', revenue: 8500, ticketsSold: 42, capacity: 60, occupancy: 70 },
];

// Generate revenue time series (last 30 days)
const generateRevenueTimeSeries = (days = 30): BookingData[] => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      bookings: Math.floor(Math.random() * 50) + 20,
    });
  }
  return data;
};

const mockBookingsTimeSeries = generateRevenueTimeSeries(30);

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
export default function EventsAnalyticsPage() {
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
      return isWithinInterval(date, { start: range.start, end: range.end });
    });
  };

  const filteredBookingsSeries = filterDataByDateRange(mockBookingsTimeSeries, dateRange);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <AnalyticsHeader 
          title="Events Analytics" 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
        />

        {/* Events Content */}
        <div className="space-y-6">
          {/* Events Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Revenue</th>
                  <th className="px-4 py-3 text-left">Sold/Capacity</th>
                </tr>
              </thead>
              <tbody>
                {mockEvents.map(event => (
                  <tr
                    key={event.id}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/newanalitics/events/${event.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-blue-600 hover:text-blue-800">{event.name}</td>
                    <td className="px-4 py-3">{event.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'Active' ? 'bg-green-100 text-green-700' :
                        event.status === 'Sold Out' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">${event.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">{event.ticketsSold}/{event.capacity}</td>
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
