'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Ticket, User, LogOut, LayoutDashboard, Settings, BarChart3 } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Ticket className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Bora Park</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <Link href="/events" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Events
              </Link>
              {user && (
                <Link href="/my-bookings" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  My Bookings
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                  <Link href="/admin/analytics" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/profile" className="hidden md:flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  <User className="h-4 w-4" />
                  <span>{user.first_name} {user.last_name}</span>
                  {user.role === 'admin' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Admin</span>
                  )}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
