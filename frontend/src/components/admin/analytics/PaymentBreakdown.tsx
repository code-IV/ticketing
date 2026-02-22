import { Card } from '@/components/ui/Card';
import { CreditCard, Smartphone, Wallet, DollarSign } from 'lucide-react';

interface PaymentMethodData {
  payment_method: string;
  revenue: string;
  count: number;
}

interface PaymentBreakdownProps {
  data: PaymentMethodData[];
}

export function PaymentBreakdown({ data }: PaymentBreakdownProps) {
  const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.revenue || '0'), 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.count, 0);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'telebirr':
        return <Smartphone className="h-4 w-4" />;
      case 'cash':
        return <Wallet className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'telebirr':
        return 'Telebirr';
      case 'cash':
        return 'Cash';
      default:
        return method;
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>Total: ${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Pie Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center mb-6">
          <div className="text-center text-gray-500">
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Payment breakdown chart will be implemented</div>
              <div className="text-xs text-gray-500">Payment methods: {data.length}</div>
            </div>
            
            {/* Simple pie visualization placeholder */}
            <div className="flex justify-center space-x-2">
              {data.map((item, index) => {
                const percentage = (parseFloat(item.revenue || '0') / totalRevenue) * 100;
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={item.payment_method} className="flex flex-col items-center">
                    <div 
                      className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}
                      title={`${getPaymentLabel(item.payment_method)}: ${percentage.toFixed(1)}%`}
                    >
                      {percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-2 max-w-16 text-center">
                      {getPaymentLabel(item.payment_method)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Detailed Breakdown */}
        <div className="space-y-3">
          {data.map((item) => {
            const percentage = (parseFloat(item.revenue || '0') / totalRevenue) * 100;
            
            return (
              <div key={item.payment_method} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="mr-3">
                    {getPaymentIcon(item.payment_method)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {getPaymentLabel(item.payment_method)}
                      </span>
                      <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${parseFloat(item.revenue || '0').toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{item.count} transactions</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
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
