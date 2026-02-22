import { Card } from '@/components/ui/Card';
import { DollarSign } from 'lucide-react';

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
        
        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Chart will be implemented with chart library</div>
              <div className="text-xs text-gray-500">Data points: {data.length}</div>
            </div>
            
            {/* Simple bar visualization placeholder */}
            <div className="flex items-end justify-center space-x-1 h-32">
              {data.slice(-7).map((item, index) => {
                const height = Math.max(20, (parseFloat(item.revenue || '0') / totalRevenue) * 100);
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${item.date}: $${item.revenue}`}
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
