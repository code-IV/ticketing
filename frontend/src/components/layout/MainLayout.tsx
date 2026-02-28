'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Navbar is fixed, so no padding needed on home; add top padding elsewhere */}
      <Navbar />
      <main className={`flex-1 ${isHomePage ? "bg-[#0A0A0A]" : "bg-gray-50 pt-16"}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}