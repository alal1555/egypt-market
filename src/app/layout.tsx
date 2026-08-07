import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yaddii Marketplace",
  description: "Buy and sell cars, phones, and services in Egypt",
};
export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0`}
    >
      <body 
        className="bg-gray-50 text-gray-900 m-0 p-0" 
        style={{ backgroundColor: '#f9fafb', colorScheme: 'light' }}
>
        {/* Fixed Top Header Layout */}
        <Navbar />
        
        {/* 🌟 THE PERFECT BALANCE:
          We wrap {children} in a container that adds standard navbar clearance (pt-14 md:pt-16).
          This ensures all sub-pages (login, favorites, search) clear the navbar instantly!
          
          Don't worry about the home page—we will adjust its padding in the step below so 
          it doesn't look double-spaced.
        */}
        <div className="pt-[50px] md:pt-[60px] pb-20 md:pb-0 min-h-screen">
          {children}
        </div>
        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav /> 
      </body>
    </html>
  );
}