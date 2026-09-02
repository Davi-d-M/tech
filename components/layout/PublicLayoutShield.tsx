'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings, type StoreSettings } from '@/lib/useSettings';

// Lazy Load Non-Critical Components
const LiveTicker = dynamic(() => import('./LiveTicker'), { ssr: false });
const AbandonedCartBar = dynamic(() => import('./AbandonedCartBar'), { ssr: false });
const SupportBubble = dynamic(() => import('./SupportBubble'), { ssr: false });
const ExitIntentPopup = dynamic(() => import('./ExitIntentPopup'), { ssr: false });
const SignInTrigger = dynamic(() => import('./SignInTrigger'), { ssr: false });
const CompareBar = dynamic(() => import('../product/CompareBar'), { ssr: false });
const AIConcierge = dynamic(() => import('../home/AIConcierge'), { ssr: false });
const ThemeSynchronizer = dynamic(() => import('./ThemeSynchronizer'), { ssr: false });
const TierThemeNode = dynamic(() => import('./TierThemeNode'), { ssr: false });
const AchievementPopup = dynamic(() => import('../ui/AchievementPopup'), { ssr: false });

export default function PublicLayoutShield({ children, initialSettings }: { children: React.ReactNode, initialSettings?: StoreSettings }) {
    return (
        <Suspense fallback={null}>
            <ShieldContent initialSettings={initialSettings}>{children}</ShieldContent>
        </Suspense>
    );
}

function ShieldContent({ children, initialSettings }: { children: React.ReactNode, initialSettings?: StoreSettings }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { settings: hookSettings } = useSettings();
    const settings = initialSettings || hookSettings;
    const isAdmin = pathname?.startsWith('/admin');
    const isRider = pathname?.startsWith('/rider');

    // 0. Dynamic Favicon
    useEffect(() => {
        if (!settings?.branding?.favicon_url || isAdmin || isRider) return;
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = settings.branding.favicon_url;
        document.getElementsByTagName('head')[0].appendChild(link);
    }, [settings, isAdmin, isRider]);

    // 1. Referral Tracking
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref && supabase) {
            // 1. Save to session storage & cookie (30 days)
            sessionStorage.setItem('apex_referral_code', ref);

            // Standard cookie set
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            document.cookie = `apex_referral_code=${ref}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;

            // 2. Increment clicks (Idempotent per session)
            const tracked = sessionStorage.getItem(`tracked_${ref}`);
            if (!tracked) {
                supabase.rpc('increment_referral_clicks', { code_input: ref })
                    .then(() => sessionStorage.setItem(`tracked_${ref}`, 'true'));
            }
        }
    }, [searchParams]);

    // 2. Live Visitor Heartbeat & Demand Prediction
    useEffect(() => {
        if (!supabase || isAdmin || isRider) return;

        let sessionId = localStorage.getItem('apex_session_id');
        if (!sessionId) {
            sessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem('apex_session_id', sessionId);
        }

        const isOperational = true;

        const sendHeartbeat = async () => {
            if (!supabase || !isOperational) return;

            // Optional: Request Geo-location for Demand Heatmap
            let lat: number | null = null;
            let lon: number | null = null;

            if (typeof window !== 'undefined' && 'geolocation' in navigator) {
                // Background request - non blocking
                navigator.geolocation.getCurrentPosition((pos) => {
                    lat = pos.coords.latitude;
                    lon = pos.coords.longitude;
                }, () => {}, { timeout: 5000 });
            }

            // Non-blocking heartbeat
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(async () => {
                    if (!supabase) return;
                    const { data: { session } } = await supabase.auth.getSession();
                    const cartData = localStorage.getItem('cart');
                    let cartValue = 0;
                    if (cartData) {
                        try {
                            const parsed = JSON.parse(cartData);
                            cartValue = parsed.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
                        } catch { }
                    }

                    await supabase.from('active_visitors').upsert({
                        session_id: sessionId,
                        visitor_id: localStorage.getItem('apex_visitor_id'), // Link to Intelligence identity
                        customer_name: session?.user?.email?.split('@')[0] || null,
                        current_page: pathname,
                        last_active_at: new Date().toISOString(),
                        cart_value: cartValue,
                        latitude: lat,
                        longitude: lon,
                        status: pathname === '/checkout' ? 'Checkout' : cartValue > 0 ? 'Browsing' : 'Idle'
                    });
                });
            } else {
                // Fallback for Safari
                setTimeout(async () => {
                    if (!supabase) return;
                    const { data: { session } } = await supabase.auth.getSession();
                    const cartData = localStorage.getItem('cart');
                    let cartValue = 0;
                    if (cartData) {
                        try {
                            const parsed = JSON.parse(cartData);
                            cartValue = parsed.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
                        } catch { }
                    }

                    await supabase.from('active_visitors').upsert({
                        session_id: sessionId,
                        visitor_id: localStorage.getItem('apex_visitor_id'), // Link to Intelligence identity
                        customer_name: session?.user?.email?.split('@')[0] || null,
                        current_page: pathname,
                        last_active_at: new Date().toISOString(),
                        cart_value: cartValue,
                        latitude: lat,
                        longitude: lon,
                        status: pathname === '/checkout' ? 'Checkout' : cartValue > 0 ? 'Browsing' : 'Idle'
                    });
                }, 1);
            }
        };

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 300000); // Pulse every 5 minutes (300s) to save battery
        return () => clearInterval(interval);
    }, [pathname, isAdmin, isRider]);

    if (isAdmin || isRider) {
        return <main className="flex-grow">{children}</main>;
    }

    return (
        <>
            <ThemeSynchronizer />
            <TierThemeNode />
            <AchievementPopup />
            <LiveTicker />
            <AbandonedCartBar />
            <Header initialSettings={settings} />
            <main className="flex-grow">{children}</main>
            <Footer initialSettings={settings} />
            <ExitIntentPopup />
            <CompareBar />
            <SupportBubble />
            <AIConcierge />
            <SignInTrigger />
        </>
    );
}
