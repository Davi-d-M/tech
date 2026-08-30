'use client';

import { useEffect, useRef } from 'react';
import { signalService } from '@/lib/signalService';
import { usePathname } from 'next/navigation';

export default function SignalTracker() {
    const pathname = usePathname();
    const dwellTimes = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        const currentDwellTimes = dwellTimes.current;
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

        window.addEventListener('click', handleGlobalClick);

        // Setup observer for sections
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
