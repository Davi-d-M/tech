import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Apexstores | Premium Electronics & Mobile Accessories Kenya',
  description: 'Authentic AirPods, high-speed chargers, and elite phone accessories. Nairobi fast dispatch. 100% genuine tech guaranteed.',
  keywords: ['AirPods Nairobi', 'iPhone Chargers Kenya', 'Phone Accessories Nairobi', 'Apexstores Tech', 'Lipa na M-Pesa Shop'],
  openGraph: {
    title: 'Apexstores | Premium Tech Store',
    description: 'Shop the latest authentic gadgets with Nairobi fast dispatch and secure M-Pesa checkout.',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com',
    siteName: 'Apexstores',
    locale: 'en_KE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apexstores | Elite Tech Catalog',
    description: 'High-performance electronics delivered instantly across Kenya.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Apexstores',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import PublicLayoutShield from "@/components/layout/PublicLayoutShield";
import JsonLd from "@/components/seo/JsonLd";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <JsonLd />
        {/* Enterprise Marketing Scripts */}
        {process.env.NEXT_PUBLIC_GA_ID && (
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
        )}
        {process.env.NEXT_PUBLIC_GA_ID && (
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `}
            </Script>
        )}

        <CartProvider>
          <WishlistProvider>
            <PublicLayoutShield>
                {children}
            </PublicLayoutShield>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
