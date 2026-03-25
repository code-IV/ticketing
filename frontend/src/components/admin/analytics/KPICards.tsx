import { Card } from '@/components/ui/Card';
import { DollarSign, Calendar, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

export function KPICard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  color = 'blue' 
}: KPICardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center text-sm font-medium ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface DashboardKPIsProps {
  data: {
    revenue: {
      revenue: string;
      completed_transactions: number;
      refunded_amount: string;
    };
    bookings: {
      total_bookings: number;
      confirmed_bookings: number;
      cancelled_bookings: number;
      total_value: string;
    };
    users: {
      new_users: number;
    };
    events: {
      active_events: number;
    };
  };
}

export function DashboardKPIs({ data }: DashboardKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total Revenue"
        value={`$${parseFloat(data.revenue.revenue || '0').toLocaleString()}`}
        icon={<DollarSign className="h-6 w-6" />}
        color="green"
      />
      
      <KPICard
        title="Total Bookings"
        value={data.bookings.total_bookings.toLocaleString()}
        icon={<Calendar className="h-6 w-6" />}
        color="blue"
      />
      
      <KPICard
        title="New Users"
        value={data.users.new_users.toLocaleString()}
        icon={<Users className="h-6 w-6" />}
        color="purple"
      />
      
      <KPICard
        title="Active Events"
        value={data.events.active_events.toLocaleString()}
        icon={<Activity className="h-6 w-6" />}
        color="orange"
      />
    </div>
  );
}
