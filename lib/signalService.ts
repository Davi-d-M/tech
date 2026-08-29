import { supabase } from './supabaseClient';

export type SignalType = 'VIEW' | 'CLICK' | 'SCROLL' | 'DWELL' | 'QUICK_VIEW' | 'ADD_TO_BAG';

interface UserSignal {
    event_type: SignalType;
    target?: string;
    metadata?: Record<string, unknown>;
    url?: string;
}

class SignalService {
    private queue: UserSignal[] = [];
    private sessionId: string = '';
    private flushInterval: number = 10000; // 10 seconds
    private timer: NodeJS.Timeout | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.sessionId = this.getOrCreateSessionId();
            this.setupAutoFlush();
        }
    }

    private getOrCreateSessionId(): string {
        let sid = sessionStorage.getItem('apex_signal_session');
        if (!sid) {
            sid = `sid-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
            sessionStorage.setItem('apex_signal_session', sid);
        }
        return sid;
    }

    private setupAutoFlush() {
        if (typeof window === 'undefined') return;

        this.timer = setInterval(() => this.flush(), this.flushInterval);

        // Final flush on exit
        window.addEventListener('beforeunload', () => this.flush());
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

        // High priority signals flush immediately
        if (signal.event_type === 'ADD_TO_BAG' || signal.event_type === 'CLICK') {
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
                user_id: session?.user?.id || null,
                event_type: s.event_type,
                target: s.target,
                metadata: s.metadata,
                url: s.url
            }));

            const { error } = await supabase.from('user_signals').insert(payload);
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
