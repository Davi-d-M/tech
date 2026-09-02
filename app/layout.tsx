import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";

// OS Build Pulse: 2026-08-27T02:45:00 (Platinum Final)

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Fix for "Failed to fetch Inter" in restricted network build envs
});

export const metadata: Metadata = {
  title: 'Apexstores | Premium Electronics & Mobile Accessories Kenya',
  description: 'Authentic AirPods, high-speed chargers, and premium phone accessories. Nairobi fast dispatch. 100% genuine tech guaranteed.',
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
    title: 'Apexstores | Premium Tech Catalog',
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
import SignalTracker from "@/components/analytics/SignalTracker";
import { type StoreSettings } from "@/lib/useSettings";
import { getCachedSettings } from "@/lib/cachedData";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings with shared cache
  const { data: settingsRes } = await getCachedSettings();
  const settings = {} as StoreSettings;
  (settingsRes || []).forEach(item => {
      const key = item.key as keyof StoreSettings;
      (settings as unknown as Record<string, unknown>)[key] = item.value;
  });

  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <JsonLd />
        <SignalTracker />
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

        {/* Meta Pixel Protocol */}
        <Script id="fb-pixel" strategy="afterInteractive">
            {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID || 'YOUR_PIXEL_ID'}');
                fbq('track', 'PageView');
            `}
        </Script>

        <CartProvider>
          <WishlistProvider>
            <PublicLayoutShield initialSettings={settings}>
                {children}
            </PublicLayoutShield>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
