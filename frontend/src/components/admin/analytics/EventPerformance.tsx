import { Card } from '@/components/ui/Card';
import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

interface EventPerformanceData {
  id: string;
  name: string;
  event_date: string;
  capacity: number;
  tickets_sold: number;
  attendance_rate: number;
  total_revenue: string;
  booking_count: number;
  avg_booking_value: string;
}

interface TicketTypeData {
  ticket_type_name: string;
  category: string;
  total_sold: number;
  total_tickets: number;
  total_revenue: string;
  avg_price: string;
}

interface EventAnalyticsProps {
  eventPerformance: EventPerformanceData[];
  ticketTypePerformance: TicketTypeData[];
}

export function EventPerformance({ eventPerformance, ticketTypePerformance }: EventAnalyticsProps) {
  const totalRevenue = eventPerformance.reduce((sum, event) => sum + parseFloat(event.total_revenue || '0'), 0);
  const totalBookings = eventPerformance.reduce((sum, event) => sum + event.booking_count, 0);
  const avgAttendanceRate = eventPerformance.length > 0 
    ? (eventPerformance.reduce((sum, event) => sum + event.attendance_rate, 0) / eventPerformance.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Events by Performance */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Event Performance</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Total Events: {eventPerformance.length}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Booking
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventPerformance.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.event_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              event.attendance_rate >= 80 ? 'bg-green-500' :
                              event.attendance_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, event.attendance_rate)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{event.attendance_rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.booking_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(event.total_revenue || '0').toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(event.avg_booking_value || '0').toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Type Performance */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Ticket Types</h3>
            <div className="space-y-3">
              {ticketTypePerformance.slice(0, 5).map((ticketType, index) => (
                <div key={ticketType.ticket_type_name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticketType.ticket_type_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{ticketType.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${parseFloat(ticketType.total_revenue || '0').toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{ticketType.total_sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Event Summary Stats */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-green-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Total Revenue</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ${totalRevenue.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Total Bookings</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {totalBookings.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-purple-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Avg Attendance Rate</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{avgAttendanceRate}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Avg Event Revenue</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ${eventPerformance.length > 0 ? (totalRevenue / eventPerformance.length).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
