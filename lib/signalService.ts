import { supabase } from './supabaseClient';

export type SignalType =
    | 'SESSION_START'
    | 'SESSION_END'
    | 'VIEW'
    | 'CLICK'
    | 'SCROLL'
    | 'DWELL'
    | 'QUICK_VIEW'
    | 'CATEGORY_VIEW'
    | 'PRODUCT_VIEW'
    | 'PRODUCT_IMAGE_VIEW'
    | 'PRODUCT_ZOOM'
    | '3D_VIEW_START'
    | '3D_INTERACT'
    | 'SEARCH'
    | 'FILTER_APPLY'
    | 'SORT_APPLY'
    | 'ADD_TO_BAG'
    | 'REMOVE_FROM_BAG'
    | 'WISHLIST_ADD'
    | 'WISHLIST_REMOVE'
    | 'CHECKOUT_START'
    | 'CHECKOUT_STEP_COMPLETE'
    | 'CHECKOUT_ABANDON'
    | 'PAYMENT_START'
    | 'PAYMENT_FAIL'
    | 'PAYMENT_SUCCESS'
    | 'ORDER_CREATE'
    | 'ORDER_CANCEL'
    | 'ORDER_REFUND'
    | 'DELIVERY_START'
    | 'DELIVERY_COMPLETE'
    | 'REVIEW_CREATE'
    | 'SUPPORT_START'
    | 'IDENTITY_BRIDGE'
    | 'HEARTBEAT'
    | 'MODAL_OPEN'
    | 'MODAL_CLOSE'
    | 'VARIANT_CHANGE'
    | 'SPEC_VIEW'
    | 'SHARE_INITIATED'
    | 'TECHNICAL_ERROR'
    | 'LATENCY_EXCEEDED';

interface UserSignal {
    event_type: SignalType;
    target?: string;
    metadata?: Record<string, unknown>;
    url?: string;
}

interface SignalPayload {
    session_id: string;
    visitor_id: string;
    user_id: string | null;
    event_type: string;
    target?: string;
    metadata?: Record<string, unknown>;
    url?: string;
}

class SignalService {
    private queue: UserSignal[] = [];
    private sessionId: string = '';
    private visitorId: string = '';
    private flushInterval: number = 10000; // 10 seconds
    private heartbeatInterval: number = 30000; // 30 seconds
    private timer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                this.sessionId = this.getOrCreateSessionId();
                this.visitorId = this.getOrCreateVisitorId();
                this.setupAutoFlush();
                this.setupHeartbeat();
                this.captureUTMs();
                // Initialize session in background to not block main thread
                setTimeout(() => {
                    this.initializeSession().catch(e => console.warn("SignalService async init failure:", e));
                }, 100);
            } catch (error) {
                console.error("SignalService Initialization Failure:", error);
            }
        }
    }

    private getOrCreateSessionId(): string {
        try {
            let sid = sessionStorage.getItem('apex_signal_session');
            if (!sid) {
                sid = `ses-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
                sessionStorage.setItem('apex_signal_session', sid);
            }
            return sid;
        } catch {
            return `ses-fallback-${Math.random().toString(36).substring(2, 8)}`;
        }
    }

    private getOrCreateVisitorId(): string {
        try {
            let vid = localStorage.getItem('apex_visitor_id');
            if (!vid) {
                vid = `vis-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
                localStorage.setItem('apex_visitor_id', vid);
            }
            return vid;
        } catch {
            return `vis-fallback-${Math.random().toString(36).substring(2, 8)}`;
        }
    }

    private captureUTMs() {
        try {
            const params = new URLSearchParams(window.location.search);
            const utms: Record<string, string | null> = {
                utm_source: params.get('utm_source'),
                utm_medium: params.get('utm_medium'),
                utm_campaign: params.get('utm_campaign'),
                utm_content: params.get('utm_content'),
                ref: params.get('ref') || params.get('affiliate')
            };

            if (utms.utm_source || utms.ref) {
                sessionStorage.setItem('apex_utms', JSON.stringify(utms));

                // ELITE ATTRIBUTION: Link to affiliate in cookie for long-term tracking
                if (utms.ref) {
                    document.cookie = `apex_affiliate_id=${utms.ref}; path=/; max-age=${60 * 60 * 24 * 30}; sameSite=lax`;
                }
            }
        } catch (error) {
            console.warn("SignalService UTM Capture Failure:", error);
        }
    }

    private async initializeSession() {
        if (!supabase) return;

        try {
            let utms: Record<string, unknown> = {};
            try {
                const stored = sessionStorage.getItem('apex_utms');
                if (stored) utms = JSON.parse(stored) as Record<string, unknown>;
            } catch {
                // Ignore parse errors
            }

            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData.session;

            // 1. Ensure Visitor Identity exists with extended attribution
            await supabase.from('visitor_identity').upsert({
                visitor_id: this.visitorId,
                user_id: session?.user?.id || null,
                acquisition_source: utms.utm_source || null,
                acquisition_campaign: utms.utm_campaign || null,
                acquisition_medium: utms.utm_medium || null,
                acquisition_content: utms.utm_content || null,
                last_seen: new Date().toISOString()
            }, { onConflict: 'visitor_id' });

            // 2. Create User Session
            await supabase.from('user_sessions').upsert({
                session_id: this.sessionId,
                visitor_id: this.visitorId,
                user_id: session?.user?.id || null,
                utm_source: utms.utm_source || null,
                utm_medium: utms.utm_medium || null,
                utm_campaign: utms.utm_campaign || null,
                utm_content: utms.utm_content || null,
                affiliate_id: utms.ref || null,
                entry_url: window.location.pathname,
                device_type: typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                browser: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'unknown'
            }, { onConflict: 'session_id' });
        } catch (error) {
            console.error("SignalService initializeSession Failure:", error);
        }
    }

    private setupAutoFlush() {
        if (typeof window === 'undefined') return;
        try {
            this.timer = setInterval(() => {
                this.flush().catch(() => {});
            }, this.flushInterval);
            window.addEventListener('beforeunload', () => {
                this.flush().catch(() => {});
            });
        } catch {
            // Ignore timer failures
        }
    }

    private setupHeartbeat() {
        if (typeof window === 'undefined') return;
        try {
            this.heartbeatTimer = setInterval(() => {
                if (!document.hidden) {
                    this.track({ event_type: 'HEARTBEAT', metadata: { active: true } });
                }
            }, this.heartbeatInterval);
        } catch {
            // Ignore timer failures
        }
    }

    public track(signal: UserSignal) {
        if (typeof window === 'undefined') return;

        try {
            // Capture approximate location hints if available in sessionStorage/localStorage
            const lat = localStorage.getItem('apex_lat');
            const lng = localStorage.getItem('apex_lng');

            this.queue.push({
                ...signal,
                url: window.location.pathname,
                metadata: {
                    ...signal.metadata,
                    timestamp: Date.now(),
                    geo_hint: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined
                }
            });

            if (['ADD_TO_BAG', 'CLICK', 'IDENTITY_BRIDGE', 'CHECKOUT_START'].includes(signal.event_type)) {
                this.flush().catch(() => {});
            }
        } catch (error) {
            console.warn("Signal tracking failure:", error);
        }
    }

    public async flush() {
        if (this.queue.length === 0 || !supabase) return;

        const signalsToFlush = [...this.queue];
        this.queue = [];

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData.session;

            const payload: SignalPayload[] = signalsToFlush.map(s => ({
                session_id: this.sessionId,
                visitor_id: this.visitorId,
                user_id: session?.user?.id || null,
                event_type: s.event_type,
                target: s.target,
                metadata: s.metadata,
                url: s.url
            }));

            const { error } = await supabase.from('user_signals').insert(payload);

            // If heartbeat, also update session dwell time
            const heartbeats = signalsToFlush.filter(s => s.event_type === 'HEARTBEAT').length;
            if (heartbeats > 0) {
                await supabase.rpc('increment_session_dwell', {
                    sid: this.sessionId,
                    inc: heartbeats * (this.heartbeatInterval / 1000)
                });
            }

            if (error) {
                console.warn("[SIGNAL] Transmission error, re-queuing...", error);
                this.queue = [...signalsToFlush, ...this.queue];
            }
        } catch (err) {
            console.error("[SIGNAL] Critical failure:", err);
            this.queue = [...signalsToFlush, ...this.queue];
        }
    }
}

export const signalService = new SignalService();
