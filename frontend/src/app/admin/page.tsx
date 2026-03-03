"use client";
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminDashboard() {
  const { isDarkTheme } = useTheme();
  return (
    <div className="space-y-8">
      <h1 className={`text-2xl font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Management Overview</h1>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className={`flex items-center justify-between p-6 ${isDarkTheme ? 'bg-bg3' : 'bg-bg2'} text-white rounded-2xl ${isDarkTheme ? 'hover:bg-indigo-700' : 'hover:bg-blue-700'} transition `}>
          <span className="font-bold text-lg">Create New Game</span>
          <span className=" text-4xl">+</span>
        </button>
        <button className={`flex items-center justify-between p-6 ${isDarkTheme ? 'bg-bg3' : 'bg-bg2'} text-white rounded-2xl ${isDarkTheme ? 'hover:bg-indigo-700' : 'hover:bg-blue-700'} transition `}>
          <span className="font-bold text-lg">Schedule Event</span>
          <span className=" text-4xl">+</span>
        </button>
        <button className={`flex items-center justify-between p-6 ${isDarkTheme ? 'bg-bg3' : 'bg-bg2'} text-white rounded-2xl ${isDarkTheme ? 'hover:bg-indigo-700' : 'hover:bg-blue-700'} transition `}>
          <span className={`font-bold text-lg ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Manage Users</span>
          <span className=" text-4xl">+</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Audit Log */}
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${isDarkTheme ? 'bg-bg3 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
            <h3 className={`font-bold ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Recent System Changes</h3>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Updated status of **Cyber Arena**</span>
              <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>2 mins ago</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Promoted **admin@test.com** to Admin</span>
              <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>1 hour ago</span>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}