import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";
import { Suspense } from "react";

// OS Build Pulse: 2026-08-27T02:45:00 (Platinum Final)

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

function RootLoadingFallback() {
    return (
        <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center antialiased">
            <div className="h-16 w-16 rounded-3xl border-2 border-primary/20 border-t-primary animate-spin"></div>
            <div className="mt-8 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 animate-pulse">Apex OS Resilience Protocol</p>
            </div>
        </div>
    );
}

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
};

import PublicLayoutShield from "@/components/layout/PublicLayoutShield";
import PublicErrorBoundary from "@/components/layout/PublicErrorBoundary";
import JsonLd from "@/components/seo/JsonLd";
import SignalTracker from "@/components/analytics/SignalTracker";
import { DEFAULT_SETTINGS } from "@/lib/useSettings";
import { type StoreSettings, SettingsRow } from "@/lib/types";
import { getCachedSettings } from "@/lib/cachedData";
import { SettingsProvider } from "@/context/SettingsContext";

/**
 * Apex OS: Streaming Resilience Shell
 * Encapsulates the dynamic settings fetch to allow the root layout to stream immediately.
 */
async function ResilienceShell({ children }: { children: React.ReactNode }) {
    let settingsRes: { data: SettingsRow[] } = { data: [] };
    try {
        const res = await getCachedSettings();
        if (res) settingsRes = res as { data: SettingsRow[] };
    } catch (err) {
        console.error("ResilienceShell Fetch Failure:", err);
    }

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
        <SettingsProvider initialSettings={settings}>
            <JsonLd />
            <SignalTracker />

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
                    <PublicLayoutShield>
                        {children}
                    </PublicLayoutShield>
                </WishlistProvider>
            </CartProvider>
        </SettingsProvider>
    );
}

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
        <PublicErrorBoundary>
            <Suspense fallback={<RootLoadingFallback />}>
                <ResilienceShell>
                    {children}
                </ResilienceShell>
            </Suspense>
        </PublicErrorBoundary>
      </body>
    </html>
  );
}
