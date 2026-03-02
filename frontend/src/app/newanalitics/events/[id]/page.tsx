"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
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
  };

type RevenueData = {
  date: string;
  revenue: number;
};

type BookingData = {
  date: string;
  bookings: number;
};

type TicketTypeData = {
  type: string;
  sold: number;
  revenue: number;
  avgPrice: number;
};

// ==================== Mock Data ====================
const mockEvents: Event[] = [
  { id: 101, name: 'Summer Pro League', game: 'Cyber Realm', date: '2026-08-15', status: 'Active', revenue: 12000, ticketsSold: 85, capacity: 100,},
  { id: 102, name: 'Midnight Scrims', game: 'Cyber Realm', date: '2026-08-20', status: 'Sold Out', revenue: 18000, ticketsSold: 120, capacity: 120,  },
  { id: 103, name: 'Newbie Bootcamp', game: 'Fantasy Quest', date: '2026-09-01', status: 'Draft', revenue: 0, ticketsSold: 12, capacity: 50,  },
  { id: 104, name: 'Pro Tournament', game: 'Speed Racer', date: '2026-08-10', status: 'Active', revenue: 8500, ticketsSold: 42, capacity: 60,  },
];

const getEventRevenueSeries = (eventId: number): RevenueData[] => {
  const event = mockEvents.find(e => e.id === eventId);
  if (!event) return [];
  
  const eventDate = new Date(event.date);
  const creationDate = new Date(eventDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // Assume event was created 30 days before event date
  const today = new Date();
  const days = Math.ceil((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const base = eventId * 500;
  return Array.from({ length: days }, (_, i) => {
    const currentDate = new Date(creationDate.getTime() + i * 24 * 60 * 60 * 1000);
    let revenue = base + Math.floor(Math.random() * 2000) + 500;
    
    // After event date, reduce revenue (event is over, less activity)
    if (currentDate > eventDate) {
      revenue = Math.max(100, revenue - Math.floor(Math.random() * 1000)); // Minimal activity after event
    }
    
    return {
      date: format(currentDate, 'yyyy-MM-dd'),
      revenue: revenue,
    };
  });
};

const getEventBookingsSeries = (eventId: number): BookingData[] => {
  const event = mockEvents.find(e => e.id === eventId);
  if (!event) return [];
  
  const eventDate = new Date(event.date);
  const creationDate = new Date(eventDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // Assume event was created 30 days before event date
  const today = new Date();
  const days = Math.ceil((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const base = eventId * 10;
  return Array.from({ length: days }, (_, i) => {
    const currentDate = new Date(creationDate.getTime() + i * 24 * 60 * 60 * 1000);
    let bookings = base + Math.floor(Math.random() * 30) + 5;
    
    // After event date, reduce bookings (event is over, less activity)
    if (currentDate > eventDate) {
      bookings = Math.max(1, bookings - Math.floor(Math.random() * 20)); // Minimal bookings after event
    }
    
    return {
      date: format(currentDate, 'yyyy-MM-dd'),
      bookings: bookings,
    };
  });
};

const getEventTicketTypeData = (eventId: number): TicketTypeData[] => {
  if (eventId === 101) { // Summer Pro League
    return [
      { type: 'Adult', sold: 40, revenue: 6800, avgPrice: 85 },
      { type: 'Child', sold: 25, revenue: 1500, avgPrice: 60 },
      { type: 'Senior', sold: 15, revenue: 900, avgPrice: 60 },
      { type: 'Group', sold: 5, revenue: 250, avgPrice: 50 },
    ];
  } else if (eventId === 102) { // Midnight Scrims
    return [
      { type: 'Adult', sold: 60, revenue: 9600, avgPrice: 80 },
      { type: 'Child', sold: 35, revenue: 2100, avgPrice: 60 },
      { type: 'Senior', sold: 20, revenue: 1200, avgPrice: 60 },
      { type: 'Group', sold: 5, revenue: 250, avgPrice: 50 },
    ];
  } else if (eventId === 103) { // Newbie Bootcamp
    return [
      { type: 'Adult', sold: 6, revenue: 480, avgPrice: 80 },
      { type: 'Child', sold: 4, revenue: 240, avgPrice: 60 },
      { type: 'Senior', sold: 1, revenue: 60, avgPrice: 60 },
      { type: 'Group', sold: 1, revenue: 50, avgPrice: 50 },
    ];
  } else if (eventId === 104) { // Pro Tournament
    return [
      { type: 'Adult', sold: 20, revenue: 1600, avgPrice: 80 },
      { type: 'Child', sold: 12, revenue: 720, avgPrice: 60 },
      { type: 'Senior', sold: 7, revenue: 420, avgPrice: 60 },
      { type: 'Group', sold: 3, revenue: 150, avgPrice: 50 },
    ];
  }
  
  // Fallback data
  return [
    { type: 'Adult', sold: 20, revenue: 1600, avgPrice: 80 },
    { type: 'Child', sold: 15, revenue: 900, avgPrice: 60 },
    { type: 'Senior', sold: 8, revenue: 480, avgPrice: 60 },
    { type: 'Group', sold: 4, revenue: 200, avgPrice: 50 },
  ];
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
export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    label: 'Last 7 days',
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  
  const selectedEvent = mockEvents.find(e => e.id === eventId) || null;

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600">The event you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/newanalitics/events')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const eventRevenueSeries = getEventRevenueSeries(selectedEvent.id);
  const eventBookingsSeries = getEventBookingsSeries(selectedEvent.id);
  const eventTicketTypeData = getEventTicketTypeData(selectedEvent.id);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <AnalyticsHeader 
            title={`${selectedEvent.name} Analytics`} 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange} 
          />
          <button
            onClick={() => router.push('/newanalitics/events')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={16} /> Back to Events
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KpiCard title="Revenue" value={`$${selectedEvent.revenue}`} icon={DollarSign} />
            <KpiCard title="Tickets Sold" value={`${selectedEvent.ticketsSold}/${selectedEvent.capacity}`} icon={Ticket} />
          </div>

          {/* Revenue & Bookings Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (Event Creation to Today)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventRevenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Trend (Event Creation to Today)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventBookingsSeries}>
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
                    data={eventTicketTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.type}: $${entry.revenue.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {eventTicketTypeData.map((entry: any, index: number) => (
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
                    data={eventTicketTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.type}: ${entry.sold} tickets`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sold"
                  >
                    {eventTicketTypeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#f97316', '#ef4444', '#10b981', '#3b82f6'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket Types Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Ticket Types for {selectedEvent.name}</h3>
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
                {eventTicketTypeData.map((ticket, index) => (
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
}
