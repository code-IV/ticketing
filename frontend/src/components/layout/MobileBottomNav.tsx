"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Gamepad2,
  Ticket,
  CalendarCheck,
} from "lucide-react";

interface MobileNavItems {
  name: string;
  href: string;
  icon: any;
  label: string;
}

const mobileNavItems: MobileNavItems[] = [
  {
    name: "home",
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    name: "events",
    href: "/events",
    icon: Calendar,
    label: "Events",
  },
  {
    name: "games",
    href: "/games",
    icon: Gamepad2,
    label: "Games",
  },
  {
    name: "buy tickets",
    href: "/buy",
    icon: Ticket,
    label: "Buy Ticket",
  },
  {
    name: "my bookings",
    href: "/my-bookings",
    icon: CalendarCheck,
    label: "My Booking",
  },
];

export function MobileBottomNav() {
  const { isDarkTheme } = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const navBg = isDarkTheme
    ? "bg-black/95 backdrop-blur-xl border-t border-gray-800/60"
    : "bg-white/95 backdrop-blur-xl border-t border-gray-200/60";

  const textColor = isDarkTheme ? "text-gray-400" : "text-gray-600";
  const activeTextColor = "text-accent";

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden ${navBg} shadow-lg`}
    >
      <div className="grid grid-cols-5 h-16 sm:h-18">
        {mobileNavItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 transition-all duration-300 group"
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-2 h-10 bg-accent/10 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Icon container */}
              <motion.div
                className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                  active
                    ? "scale-110"
                    : "scale-100 group-hover:scale-105"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  size={20}
                  className={`transition-colors duration-300 ${
                    active ? activeTextColor : textColor
                  } group-hover:${activeTextColor}`}
                />
              </motion.div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium transition-all duration-300 ${
                  active
                    ? `${activeTextColor} font-semibold`
                    : `${textColor} group-hover:${activeTextColor}`
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area padding for iPhone */}
      <div className="h-safe-or-2 bg-inherit" />
    </motion.nav>
  );
}
