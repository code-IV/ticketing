"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Gamepad2, Calendar, Users } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDarkTheme } = useTheme();
  
  const nav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Games', href: '/admin/games', icon: Gamepad2 },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Users', href: '/admin/user', icon: Users },
  ];

  return (
    <div className={`flex h-screen ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <aside className={`w-64 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'} border-r ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-6 font-bold text-xl border-b ${isDarkTheme ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>Admin Panel</div>
        <nav className="p-4 space-y-2">
          {nav.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                pathname === item.href ? `${isDarkTheme ? 'bg-indigo-600' : 'bg-blue-600'} text-white` : `${isDarkTheme ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`
              }`}
            >
              <item.icon size={20} /> {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}