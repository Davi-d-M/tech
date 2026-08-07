'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import LiveTicker from './LiveTicker';
import AbandonedCartBar from './AbandonedCartBar';
import SupportBubble from './SupportBubble';
import ExitIntentPopup from './ExitIntentPopup';
import SignInTrigger from './SignInTrigger';
import CompareBar from '../product/CompareBar';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/lib/useSettings';

export default function PublicLayoutShield({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <ShieldContent>{children}</ShieldContent>
        </Suspense>
    );
}

function ShieldContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { settings } = useSettings();
    const isAdmin = pathname?.startsWith('/admin');

    // 0. Dynamic Favicon
    useEffect(() => {
        if (settings?.branding?.favicon_url) {
            const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = settings.branding.favicon_url;
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    }, [settings]);

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

    // 2. Live Visitor Heartbeat
    useEffect(() => {
        if (!supabase || isAdmin) return;

        let sessionId = localStorage.getItem('apex_session_id');
        if (!sessionId) {
            sessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem('apex_session_id', sessionId);
        }

        let isOperational = true;

        const sendHeartbeat = async () => {
            if (!supabase || !isOperational) return;
            const { data: { session } } = await supabase.auth.getSession();
            const cartData = localStorage.getItem('cart');
            let cartValue = 0;
            if (cartData) {
                try {
                    const parsed = JSON.parse(cartData);
                    cartValue = parsed.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
                } catch { }
            }

            const { error } = await supabase.from('active_visitors').upsert({
                session_id: sessionId,
                customer_name: session?.user?.email?.split('@')[0] || null,
                current_page: pathname,
                last_active_at: new Date().toISOString(),
                cart_value: cartValue,
                status: pathname === '/checkout' ? 'Checkout' : cartValue > 0 ? 'Browsing' : 'Idle'
            });

            if (error && (error.code === '42P01' || (error as { status?: number }).status === 403)) {
                // Table doesn't exist or Forbidden - stop trying to avoid console clutter
                isOperational = false;
            }
        };

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 60000); // Pulse every 60s
        return () => clearInterval(interval);
    }, [pathname, isAdmin]);

    if (isAdmin) {
        return <main className="flex-grow">{children}</main>;
    }

    return (
        <>
            <LiveTicker />
            <AbandonedCartBar />
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ExitIntentPopup />
            <CompareBar />
            <SupportBubble />
            <SignInTrigger />
        </>
    );
}
