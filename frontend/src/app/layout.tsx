import type { Metadata } from "next";
import { Inter, DM_Sans, Plus_Jakarta_Sans, Montserrat, Unbounded } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MainLayout } from "@/components/layout/MainLayout";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans"
});

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat"
});

const unbounded = Unbounded({ 
  subsets: ["latin"],
  variable: "--font-unbounded"
});

export const metadata: Metadata = {
  title: "Bora Amusement Park - Online Ticketing",
  description:
    "Book your tickets online for Bora Amusement Park, Ethiopia's premier entertainment destination.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSans.variable} ${plusJakartaSans.variable} ${montserrat.variable} ${unbounded.variable} font-sans`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
