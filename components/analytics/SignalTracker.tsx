'use client';

import { useEffect, useRef } from 'react';
import { signalService } from '@/lib/signalService';
import { usePathname } from 'next/navigation';

export default function SignalTracker() {
    const pathname = usePathname();
    const dwellTimes = useRef<Map<string, number>>(new Map());
    const scrollMilestones = useRef<Set<number>>(new Set());

    useEffect(() => {
        // 📱 PWA: Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
            });
        }

        const currentDwellTimes = dwellTimes.current;
        const currentMilestones = scrollMilestones.current;
        currentMilestones.clear(); // Reset for new page

        // Track page view
        signalService.track({ event_type: 'VIEW', target: pathname });

        // 🖱️ Global Click Listener (Tactical Interaction)
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const trackable = target.closest('[data-track-click]');
            if (trackable) {
                const elementId = trackable.getAttribute('data-track-click') || trackable.id || 'anonymous_btn';
                signalService.track({
                    event_type: 'CLICK',
                    target: elementId,
                    metadata: {
                        text: trackable.textContent?.trim().substring(0, 20),
                        tag: trackable.tagName
                    }
                });
            }
        };

        // 📜 Scroll Depth Monitor
        const handleScrollDepth = () => {
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';
            const percent = ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100;

            [25, 50, 75, 100].forEach(milestone => {
                if (percent >= milestone && !currentMilestones.has(milestone)) {
                    currentMilestones.add(milestone);
                    signalService.track({
                        event_type: 'SCROLL',
                        target: `${milestone}%`,
                        metadata: { depth_percent: milestone }
                    });
                }
            });
        };

        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('scroll', handleScrollDepth, { passive: true });

        // 🛡️ Technical Resilience: Global Error Capture
        const handleGlobalError = (event: ErrorEvent) => {
            signalService.track({
                event_type: 'TECHNICAL_ERROR',
                target: event.message,
                metadata: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack?.substring(0, 500)
                }
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            signalService.track({
                event_type: 'TECHNICAL_ERROR',
                target: 'Unhandled Promise Rejection',
                metadata: {
                    reason: String(event.reason)
                }
            });
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Setup observer for sections
        if (typeof IntersectionObserver === 'undefined') return;

        const sections = document.querySelectorAll('[data-signal-section]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionId = entry.target.getAttribute('id') || entry.target.getAttribute('data-signal-section') || 'unknown';

                if (entry.isIntersecting) {
                    // User started looking at section
                    currentDwellTimes.set(sectionId, Date.now());
                } else {
                    // User scrolled away
                    const startTime = currentDwellTimes.get(sectionId);
                    if (startTime) {
                        const duration = Date.now() - startTime;
                        if (duration > 1000) { // Only track if dwell > 1s
                            signalService.track({
                                event_type: 'DWELL',
                                target: sectionId,
                                metadata: { duration_ms: duration }
                            });
                        }
                        currentDwellTimes.delete(sectionId);
                    }
                }
            });
        }, { threshold: 0.5 }); // 50% of section must be visible

        sections.forEach(section => observer.observe(section));

        return () => {
            observer.disconnect();
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('scroll', handleScrollDepth);
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            // Flush any remaining dwell times
            currentDwellTimes.forEach((startTime, sectionId) => {
                const duration = Date.now() - startTime;
                if (duration > 1000) {
                    signalService.track({
                        event_type: 'DWELL',
                        target: sectionId,
                        metadata: { duration_ms: duration }
                    });
                }
            });
            currentDwellTimes.clear();
        };
    }, [pathname]);

    return null; // Invisible component
}
