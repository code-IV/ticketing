"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Gamepad2, Calendar, Users, Menu, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDarkTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Hide sidebar on analytics pages
  const isAnalyticsPage = pathname.startsWith('/admin/analitics');
  
  const nav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Games', href: '/admin/games', icon: Gamepad2 },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Users', href: '/admin/user', icon: Users },
  ];

  return (
    <div className={`flex h-screen px-4 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
      {/* Mobile Menu Button - Hidden on analytics pages */}
      {!isAnalyticsPage && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-3 rounded-lg transition-colors ${
              isDarkTheme 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-white text-gray-900 hover:bg-gray-100'
            } shadow-lg`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Sidebar - Hidden on analytics pages */}
      {!isAnalyticsPage && (
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
          ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'} border-r ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className={`p-4 sm:p-6 font-bold text-lg sm:text-xl border-b ${isDarkTheme ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span>Admin Panel</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`lg:hidden p-1 rounded ${
                  isDarkTheme ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            {nav.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition text-sm sm:text-base ${
                  pathname === item.href 
                    ? `${isDarkTheme ? 'bg-indigo-600' : 'bg-blue-600'} text-white` 
                    : `${isDarkTheme ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`
                }`}
              >
                <item.icon size={18} className="sm:w-5 sm:h-5" /> 
                <span className="text-xs sm:text-sm">{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* Overlay for mobile - Hidden on analytics pages */}
      {!isAnalyticsPage && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto pt-16 lg:pt-0 ${isAnalyticsPage ? 'pt-4' : ''}`}>
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}