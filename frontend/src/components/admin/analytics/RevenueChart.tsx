import { Card } from '@/components/ui/Card';
import { DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  date: string;
  revenue: string;
  transaction_count: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  title?: string;
}

export function RevenueChart({ data, title = "Revenue Over Time" }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.revenue || '0'), 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.transaction_count, 0);

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>Total: ${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Revenue Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  name === 'revenue' ? `$${parseFloat(value || 0).toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Transactions'
                ]}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-lg font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Transactions</p>
            <p className="text-lg font-semibold text-gray-900">{totalTransactions.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Transaction</p>
            <p className="text-lg font-semibold text-gray-900">
              ${totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
