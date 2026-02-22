import { Card } from '@/components/ui/Card';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface BookingData {
  date: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  total_value: string;
}

interface BookingTrendsProps {
  data: BookingData[];
  title?: string;
}

export function BookingTrends({ data, title = "Booking Trends" }: BookingTrendsProps) {
  const totalBookings = data.reduce((sum, item) => sum + item.total_bookings, 0);
  const totalConfirmed = data.reduce((sum, item) => sum + item.confirmed_bookings, 0);
  const totalCancelled = data.reduce((sum, item) => sum + item.cancelled_bookings, 0);
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
        
        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Booking trends chart will be implemented</div>
              <div className="text-xs text-gray-500">Data points: {data.length}</div>
            </div>
            
            {/* Simple stacked bar visualization placeholder */}
            <div className="flex items-end justify-center space-x-1 h-32">
              {data.slice(-7).map((item, index) => {
                const maxHeight = 100;
                const confirmedHeight = (item.confirmed_bookings / Math.max(...data.map(d => d.total_bookings))) * maxHeight;
                const cancelledHeight = (item.cancelled_bookings / Math.max(...data.map(d => d.total_bookings))) * maxHeight;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex items-end">
                      {confirmedHeight > 0 && (
                        <div 
                          className="w-6 bg-green-500 rounded-t"
                          style={{ height: `${confirmedHeight}%` }}
                          title={`Confirmed: ${item.confirmed_bookings}`}
                        />
                      )}
                      {cancelledHeight > 0 && (
                        <div 
                          className="w-6 bg-red-500 rounded-t"
                          style={{ height: `${cancelledHeight}%` }}
                          title={`Cancelled: ${item.cancelled_bookings}`}
                        />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 rotate-45 origin-left">
                      {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
