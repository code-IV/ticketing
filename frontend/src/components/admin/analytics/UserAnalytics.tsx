import { Card } from '@/components/ui/Card';
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';

interface RegistrationData {
  date: string;
  new_users: number;
}

interface RoleData {
  role: string;
  count: number;
  percentage: number;
}

interface ActiveData {
  is_active: boolean;
  count: number;
}

interface BookingParticipationData {
  users_with_bookings: number;
  total_users: number;
  percentage: number;
}

interface UserAnalyticsProps {
  registrations: RegistrationData[];
  roleBreakdown: RoleData[];
  activeStatus: ActiveData[];
  bookingParticipation: BookingParticipationData;
}

export function UserAnalytics({ 
  registrations, 
  roleBreakdown, 
  activeStatus, 
  bookingParticipation 
}: UserAnalyticsProps) {
  const totalNewUsers = registrations.reduce((sum, item) => sum + item.new_users, 0);
  const activeUsers = activeStatus.find(status => status.is_active === true)?.count || 0;
  const inactiveUsers = activeStatus.find(status => status.is_active === false)?.count || 0;

  return (
    <div className="space-y-6">
      {/* Registration Trends */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">User Registration Trends</h3>
            <div className="flex items-center text-sm text-gray-600">
              <UserPlus className="h-4 w-4 mr-1" />
              <span>New Users: {totalNewUsers.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Registration chart will be implemented</div>
                <div className="text-xs text-gray-500">Data points: {registrations.length}</div>
              </div>
              
              {/* Simple line visualization placeholder */}
              <div className="flex items-end justify-center space-x-1 h-32">
                {registrations.slice(-7).map((item, index) => {
                  const height = Math.max(10, (item.new_users / Math.max(...registrations.map(r => r.new_users))) * 100);
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-8 bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${item.date}: ${item.new_users} users`}
                      />
                      <div className="text-xs text-gray-600 mt-1 rotate-45 origin-left">
                        {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Breakdown */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Roles</h3>
            <div className="space-y-3">
              {roleBreakdown.map((role) => (
                <div key={role.role} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900 capitalize">{role.role}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{role.count.toLocaleString()}</span>
                    <span className="text-sm font-medium text-blue-600">{role.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Active Status */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-4">
              {activeStatus.map((status) => (
                <div key={status.is_active.toString()} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {status.is_active ? (
                      <UserCheck className="h-4 w-4 text-green-500 mr-3" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-500 mr-3" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {status.is_active ? 'Active Users' : 'Inactive Users'}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${
                    status.is_active ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Booking Participation */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Participation</h3>
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-blue-600 font-medium">Users with Bookings</p>
                <p className="text-2xl font-bold text-blue-700">
                  {bookingParticipation.users_with_bookings.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-blue-700">
                  {bookingParticipation.total_users.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Participation Rate</p>
                <p className="text-2xl font-bold text-blue-700">
                  {bookingParticipation.percentage}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
