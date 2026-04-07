"use client";

import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

interface MainLayoutProps {
  children: ReactNode;
  Nav: { name: string; href: string; iconName: string }[];
}

export function MainLayout({ children, Nav }: MainLayoutProps) {
  const pathname = usePathname();
  const { isDarkTheme } = useTheme();
  const isHomePage = pathname === "/";
  const isAuthPage =
    pathname === "/auth" || pathname === "/login" || pathname === "/register";

  return (
    <div
      className={`min-h-screen flex flex-col relative ${isDarkTheme ? "bg-[#0A0A0A]" : "bg-white"}`}
    >
      {/* Navbar is fixed, so no padding needed on home; add top padding elsewhere */}
      {!isAuthPage && <Navbar nav={Nav} />}
      <main className={`flex-1 ${isHomePage || isAuthPage ? "" : "pt-16 lg:pt-16"} pb-16 md:pb-0`}>
        {children}
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <MobileBottomNav />}
    </div>
  );
}
