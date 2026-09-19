'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettingsContext } from '@/context/SettingsContext';
import { Smartphone } from 'lucide-react';

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

function ShieldLoading() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary animate-pulse" />
        </div>
    );
}

/**
 * Isolates useSearchParams to prevent blocking the entire root layout
 */
function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        try {
            const ref = searchParams.get('ref');
            if (ref && supabase) {
                // 1. Save to session storage & cookie (30 days)
                sessionStorage.setItem('apex_referral_code', ref);

                // Standard cookie set
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 30);
                document.cookie = `apex_ref_code=${ref}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;

                // 2. Increment clicks (Idempotent per session)
                const tracked = sessionStorage.getItem(`tracked_${ref}`);
                if (!tracked) {
                    // Call both standard and affiliate RPCs (Non-blocking)
                    void supabase.rpc('increment_referral_clicks', { code_input: ref });
                    void supabase.rpc('increment_affiliate_clicks', { code_input: ref });
                    sessionStorage.setItem(`tracked_${ref}`, 'true');
                }
            }
        } catch (error) {
            console.warn("Referral Tracking Failure:", error);
        }
    }, [searchParams]);

    return null;
}

export default function PublicLayoutShield({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<ShieldLoading />}>
            <ShieldContent>{children}</ShieldContent>
        </Suspense>
    );
}

function ShieldContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const settings = useSettingsContext();
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

    // 2. Live Visitor Heartbeat & Demand Prediction
    useEffect(() => {
        if (!supabase || isAdmin || isRider) return;

        let sessionId: string | null = null;
        try {
            sessionId = localStorage.getItem('apex_session_id');
            if (!sessionId) {
                sessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
                localStorage.setItem('apex_session_id', sessionId);
            }
        } catch {
            sessionId = `session-fallback-${Math.random().toString(36).substring(2, 8)}`;
        }

        const isOperational = true;

        const sendHeartbeat = async () => {
            if (!supabase || !isOperational || !sessionId) return;

            // Non-blocking heartbeat
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(async () => {
                    if (!supabase) return;
                    try {
                        const { data: sessionData } = await supabase.auth.getSession();
                        const session = sessionData.session;
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
                            customer_name: (session?.user?.email?.split('@') || [])[0] || null,
                            current_page: pathname,
                            last_active_at: new Date().toISOString(),
                            cart_value: cartValue,
                            status: pathname === '/checkout' ? 'Checkout' : cartValue > 0 ? 'Browsing' : 'Idle'
                        });
                    } catch { }
                });
            } else {
                // Fallback for Safari
                setTimeout(async () => {
                    if (!supabase) return;
                    try {
                        const { data: sessionData } = await supabase.auth.getSession();
                        const session = sessionData.session;
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
                            customer_name: (session?.user?.email?.split('@') || [])[0] || null,
                            current_page: pathname,
                            last_active_at: new Date().toISOString(),
                            cart_value: cartValue,
                            status: pathname === '/checkout' ? 'Checkout' : cartValue > 0 ? 'Browsing' : 'Idle'
                        });
                    } catch { }
                }, 1);
            }
        };

        sendHeartbeat();
        const interval = setInterval(() => {
            sendHeartbeat().catch(() => {});
        }, 300000); // Pulse every 5 minutes (300s) to save battery
        return () => clearInterval(interval);
    }, [pathname, isAdmin, isRider]);

    if (isAdmin || isRider) {
        return <main className="flex-grow">{children}</main>;
    }

    return (
        <>
            <Suspense fallback={null}>
                <ReferralTracker />
            </Suspense>
            <ThemeSynchronizer />
            <TierThemeNode />
            <AchievementPopup />
            <LiveTicker />
            <AbandonedCartBar />
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ExitIntentPopup />
            <CompareBar />
            <SupportBubble />
            <AIConcierge />
            <SignInTrigger />
        </>
    );
}
