import { supabase } from './supabaseClient';

export type SignalType =
    | 'VIEW'
    | 'CLICK'
    | 'SCROLL'
    | 'DWELL'
    | 'QUICK_VIEW'
    | 'ADD_TO_BAG'
    | 'SEARCH'
    | 'HEARTBEAT'
    | 'CHECKOUT_START'
    | 'PAYMENT_FAIL'
    | 'IDENTITY_BRIDGE';

interface UserSignal {
    event_type: SignalType;
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
            this.sessionId = this.getOrCreateSessionId();
            this.visitorId = this.getOrCreateVisitorId();
            this.setupAutoFlush();
            this.setupHeartbeat();
            this.captureUTMs();
            this.initializeSession();
        }
    }

    private getOrCreateSessionId(): string {
        let sid = sessionStorage.getItem('apex_signal_session');
        if (!sid) {
            sid = `ses-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
            sessionStorage.setItem('apex_signal_session', sid);
        }
        return sid;
    }

    private getOrCreateVisitorId(): string {
        let vid = localStorage.getItem('apex_visitor_id');
        if (!vid) {
            vid = `vis-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
            localStorage.setItem('apex_visitor_id', vid);
        }
        return vid;
    }

    private captureUTMs() {
        const params = new URLSearchParams(window.location.search);
        const utms = {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_content: params.get('utm_content')
        };
        if (utms.utm_source) {
            sessionStorage.setItem('apex_utms', JSON.stringify(utms));
        }
    }

    private async initializeSession() {
        if (!supabase) return;

        const utms = JSON.parse(sessionStorage.getItem('apex_utms') || '{}');
        const { data: { session } } = await supabase.auth.getSession();

        // 1. Ensure Visitor Identity exists
        await supabase.from('visitor_identity').upsert({
            visitor_id: this.visitorId,
            user_id: session?.user?.id || null,
            acquisition_source: utms.utm_source,
            acquisition_campaign: utms.utm_campaign,
            last_seen: new Date().toISOString()
        }, { onConflict: 'visitor_id' });

        // 2. Create User Session
        await supabase.from('user_sessions').upsert({
            session_id: this.sessionId,
            visitor_id: this.visitorId,
            user_id: session?.user?.id || null,
            utm_source: utms.utm_source,
            utm_medium: utms.utm_medium,
            utm_campaign: utms.utm_campaign,
            utm_content: utms.utm_content,
            entry_url: window.location.pathname,
            device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            browser: navigator.userAgent.substring(0, 50)
        }, { onConflict: 'session_id' });
    }

    private setupAutoFlush() {
        if (typeof window === 'undefined') return;
        this.timer = setInterval(() => this.flush(), this.flushInterval);
        window.addEventListener('beforeunload', () => this.flush());
    }

    private setupHeartbeat() {
        if (typeof window === 'undefined') return;
        this.heartbeatTimer = setInterval(() => {
            if (!document.hidden) {
                this.track({ event_type: 'HEARTBEAT', metadata: { active: true } });
            }
        }, this.heartbeatInterval);
    }

    public track(signal: UserSignal) {
        if (typeof window === 'undefined') return;

        this.queue.push({
            ...signal,
            url: window.location.pathname,
            metadata: {
                ...signal.metadata,
                timestamp: Date.now()
            }
        });

        if (['ADD_TO_BAG', 'CLICK', 'IDENTITY_BRIDGE', 'CHECKOUT_START'].includes(signal.event_type)) {
            this.flush();
        }
    }

    public async flush() {
        if (this.queue.length === 0 || !supabase) return;

        const signalsToFlush = [...this.queue];
        this.queue = [];

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const payload = signalsToFlush.map(s => ({
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
