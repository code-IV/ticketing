"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Ticket,
  User,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="bg-white backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/BoraPark.png"
              alt="BoraPark Logo"
              width={160}
              height={160}
              className="bg-transparent group-hover:scale-110 transition-transform"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/events"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-1 py-2"
            >
              Events
            </Link>
            {user && (
              <Link
                href="/my-bookings"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-1 py-2"
              >
                My Bookings
              </Link>
            )}

            {user?.role === "admin" && (
              <div className="flex items-center gap-6">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-1.5 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
              </div>
            )}
          </div>

          {/* Auth / User */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors group"
                >
                  <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                    <User className="h-4 w-4 text-blue-700" />
                  </div>
                  <span>
                    {user.first_name} {user.last_name}
                  </span>
                  {user.role === "admin" && (
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                      Admin
                    </span>
                  )}
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="px-6">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t bg-white/95 backdrop-blur-sm overflow-hidden"
        >
          <div className="px-4 py-6 space-y-5">
            <Link
              href="/events"
              className="block text-gray-700 hover:text-blue-600 font-medium py-2"
              onClick={() => setMobileOpen(false)}
            >
              Events
            </Link>

            {user && (
              <Link
                href="/my-bookings"
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                My Bookings
              </Link>
            )}

            {user?.role === "admin" && (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-medium py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-medium py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <BarChart3 className="h-5 w-5" />
                  Analytics
                </Link>
              </>
            )}

            <div className="pt-4 border-t">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <User className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      {user.role === "admin" && (
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2"
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
