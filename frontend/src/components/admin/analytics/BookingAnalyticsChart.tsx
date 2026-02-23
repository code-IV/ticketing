import { Card } from '@/components/ui/Card';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';

interface BookingData {
  date: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  total_value: string;
}

interface BookingAnalyticsChartProps {
  data: BookingData[];
  title?: string;
}

export function BookingAnalyticsChart({ data, title = "Booking Analytics" }: BookingAnalyticsChartProps) {
  const totalBookings = data.reduce((sum, item) => sum + (item.total_bookings || 0), 0);
  const totalConfirmed = data.reduce((sum, item) => sum + (item.confirmed_bookings || 0), 0);
  const totalCancelled = data.reduce((sum, item) => sum + (item.cancelled_bookings || 0), 0);
  const totalPending = data.reduce((sum, item) => sum + (item.pending_bookings || 0), 0);
  const totalValue = data.reduce((sum, item) => sum + parseFloat(item.total_value || '0'), 0);

  const confirmationRate = totalBookings > 0 ? (totalConfirmed / totalBookings * 100).toFixed(1) : '0.0';
  const cancellationRate = totalBookings > 0 ? (totalCancelled / totalBookings * 100).toFixed(1) : '0.0';

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Total: {totalBookings.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Booking Analytics Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  value.toLocaleString(),
                  name === 'confirmed_bookings' ? 'Confirmed' :
                  name === 'cancelled_bookings' ? 'Cancelled' :
                  name === 'pending_bookings' ? 'Pending' :
                  name === 'total_trend' ? 'Total Trend' : 'Total'
                ]}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Bar dataKey="confirmed_bookings" stackId="a" fill="#10b981" name="Confirmed" />
              <Bar dataKey="cancelled_bookings" stackId="a" fill="#ef4444" name="Cancelled" />
              <Bar dataKey="pending_bookings" stackId="a" fill="#f59e0b" name="Pending" />
              <Line 
                type="monotone" 
                dataKey="total_bookings" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                name="Total Trend"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-lg font-semibold text-gray-900">{totalBookings.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-lg font-semibold text-green-600">{totalConfirmed.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-lg font-semibold text-red-600">{totalCancelled.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-lg font-semibold text-gray-900">${totalValue.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Rates */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600 font-medium">Confirmation Rate</p>
            <p className="text-2xl font-bold text-green-700">{confirmationRate}%</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600 font-medium">Cancellation Rate</p>
            <p className="text-2xl font-bold text-red-700">{cancellationRate}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
