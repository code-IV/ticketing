"use client";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  BarChart3,
  Menu,
  X,
  User,
  LogOut,
  Ticket,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Nav {
  name: string;
  href: string;
  iconName: string;
}

export function Navbar({ nav }: { nav: Nav[] }) {
  const { user, logout } = useAuth();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 40);
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Theme-aware navbar styling
  const navBg = isHomePage
    ? scrolled
      ? isDarkTheme
        ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
        : "bg-white/80 backdrop-blur-xl border-b border-gray-200/60"
      : "bg-transparent border-b border-transparent"
    : isDarkTheme
      ? "bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-gray-700/60 shadow-sm"
      : "bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-sm";

  const linkColor = isHomePage
    ? isDarkTheme
      ? "text-white/80 hover:text-[#FFD84D]"
      : "text-gray-600 hover:text-gray-900"
    : isDarkTheme
      ? "text-white/80 hover:text-[#FFD84D]"
      : "text-gray-600 hover:text-gray-900";

  const logoFilter = isHomePage
    ? isDarkTheme
      ? "brightness-0 invert"
      : ""
    : isDarkTheme
      ? "brightness-0 invert"
      : "";

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/BoraPark.png"
                alt="BoraPark"
                width={140}
                height={40}
                className={`transition-all duration-300 group-hover:opacity-80 ${logoFilter}`}
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-semibold transition-colors ${linkColor} ${pathname === item.href ? (isDarkTheme ? "text-[#FFD84D]" : "text-gray-900") : ""}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all ${
                  isDarkTheme
                    ? "hover:bg-white/10 text-white"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                title="Toggle theme"
              >
                {isDarkTheme ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className={`flex items-center gap-2 text-sm font-semibold transition-colors ${linkColor}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkTheme ? "bg-white/15" : "bg-gray-100"}`}
                    >
                      <User
                        className={`h-4 w-4 ${isDarkTheme ? "text-white" : "text-gray-700"}`}
                      />
                    </div>
                    {user.first_name}
                    {(user?.roles.includes("SUPERADMIN") && (
                      <span className="text-[10px] bg-[#FFD84D] text-black px-2 py-0.5 rounded-full font-black uppercase">
                        Super Admin
                      </span>
                    )) ||
                      (user?.roles.includes("ADMIN") && (
                        <span className="text-[10px] bg-[#FFD84D] text-black px-2 py-0.5 rounded-full font-black uppercase">
                          Admin
                        </span>
                      ))}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
                      isDarkTheme
                        ? "border-white/20 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/40"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <button
                      className={`text-sm font-semibold px-5 py-2 rounded-full transition-all ${
                        isDarkTheme
                          ? "text-white/80 hover:text-white hover:bg-white/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Login
                    </button>
                  </Link>
                  <Link href="/auth">
                    <button className="text-sm font-black px-6 py-2.5 rounded-full bg-[#FFD84D] text-black hover:bg-white transition-all shadow-lg shadow-yellow-400/20">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-xl transition-colors ${isDarkTheme ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-800"}`}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 top-16 z-40 md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10"
        >
          <div className="px-6 py-8 space-y-6">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 text-white/80 hover:text-[#FFD84D] font-semibold py-1 transition-colors text-lg"
            >
              {isDarkTheme ? (
                <>
                  <Sun className="h-5 w-5" /> Light Theme
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5" /> Dark Theme
                </>
              )}
            </button>

            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-white/80 hover:text-[#FFD84D] font-semibold py-1 transition-colors text-lg"
              >
                {item.name}
              </Link>
            ))}

            <div className="pt-6 border-t border-white/10">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {user.first_name} {user.last_name}
                      </p>
                      {(user?.roles.includes("SUPERADMIN") && (
                        <span className="text-[10px] bg-[#FFD84D] text-black px-2 py-0.5 rounded-full font-black uppercase">
                          Super Admin
                        </span>
                      )) ||
                        (user?.roles.includes("ADMIN") && (
                          <span className="text-[10px] bg-[#FFD84D] text-black px-2 py-0.5 rounded-full font-black uppercase">
                            Admin
                          </span>
                        ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 border border-white/20 text-white/70 font-semibold py-3 rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth" onClick={() => setMobileOpen(false)}>
                    <button className="w-full border border-white/20 text-white font-semibold py-3 rounded-2xl hover:bg-white/10 transition-colors">
                      Login
                    </button>
                  </Link>
                  <Link href="/auth" onClick={() => setMobileOpen(false)}>
                    <button className="w-full bg-[#FFD84D] text-black font-black py-3 rounded-2xl hover:bg-white transition-colors">
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
