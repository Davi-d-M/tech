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
import { DEFAULT_SETTINGS } from "@/lib/useSettings";
import { type StoreSettings, SettingsRow } from "@/lib/types";
import { getCachedSettings } from "@/lib/cachedData";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings with shared cache & Defensive try-catch
  let settingsRes: { data: SettingsRow[] } = { data: [] };
  try {
      const res = await getCachedSettings();
      if (res) settingsRes = res as { data: SettingsRow[] };
  } catch (err) {
      console.error("RootLayout Settings Fetch Crash:", err);
  }

  // Process Settings - Start with DEFAULTS to prevent null crashes
  const settings: StoreSettings = { ...DEFAULT_SETTINGS };

  if (settingsRes?.data) {
      (settingsRes.data || []).forEach(item => {
          const key = item.key as keyof StoreSettings;
          const value = item.value || {};
          if (key === 'contact') settings.contact = { ...settings.contact, ...(value as StoreSettings['contact']) };
          else if (key === 'branding') settings.branding = { ...settings.branding, ...(value as StoreSettings['branding']) };
          else if (key === 'homepage') settings.homepage = { ...settings.homepage, ...(value as StoreSettings['homepage']) };
          else if (key === 'catalog') settings.catalog = { ...settings.catalog, ...(value as StoreSettings['catalog']) };
          else if (key === 'shipping') settings.shipping = { ...settings.shipping, ...(value as StoreSettings['shipping']) };
          else if (key === 'logistics') settings.logistics = { ...settings.logistics, ...(value as StoreSettings['logistics']) };
          else if (key === 'theme_config') settings.theme_config = { ...settings.theme_config, ...(value as StoreSettings['theme_config']) };
          else if (key === 'seo_config') settings.seo_config = { ...settings.seo_config, ...(value as StoreSettings['seo_config']) };
          else if (key === 'social_links') settings.social_links = { ...settings.social_links, ...(value as StoreSettings['social_links']) };
          else if (key === 'store_info') settings.store_info = { ...settings.store_info, ...(value as StoreSettings['store_info']) };
          else if (key === 'features') settings.features = { ...settings.features, ...(value as StoreSettings['features']) };
          else if (key === 'promotions') settings.promotions = { ...(settings.promotions || {}), ...(value as NonNullable<StoreSettings['promotions']>) } as StoreSettings['promotions'];
          else if (key === 'layout') settings.layout = { ...(settings.layout || {}), ...(value as NonNullable<StoreSettings['layout']>) } as StoreSettings['layout'];
          else if (key === 'navigation') settings.navigation = { ...(settings.navigation || {}), ...(value as NonNullable<StoreSettings['navigation']>) } as StoreSettings['navigation'];
          else if (key === 'globals') settings.globals = { ...(settings.globals || {}), ...(value as NonNullable<StoreSettings['globals']>) } as StoreSettings['globals'];
          else if (key === 'content') settings.content = { ...(settings.content || {}), ...(value as NonNullable<StoreSettings['content']>) } as StoreSettings['content'];
      });
  }

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
