import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { LOCALE_STORAGE_KEY } from "@/i18n/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
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
      dir="ltr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased m-0 p-0`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("${LOCALE_STORAGE_KEY}");if(l==="ar"){document.documentElement.lang="ar";document.documentElement.dir="rtl";}}catch(e){}})();`,
          }}
        />
      </head>
      <body 
        className="bg-gray-50 text-gray-900 m-0 p-0" 
        style={{ backgroundColor: '#f9fafb', colorScheme: 'light' }}
>
        <Providers>
        {/* Fixed Top Header Layout */}
        <Navbar />
        
        {/* 🌟 THE PERFECT BALANCE:
          We wrap {children} in a container that adds standard navbar clearance (pt-14 md:pt-16).
          This ensures all sub-pages (login, favorites, search) clear the navbar instantly!
          
          Don't worry about the home page—we will adjust its padding in the step below so 
          it doesn't look double-spaced.
        */}
        <div className="pt-[102px] md:pt-[60px] pb-20 md:pb-0 min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav /> 
        </Providers>
      </body>
    </html>
  );
}