'use client';

import { useEffect, useRef } from 'react';
import { signalService } from '@/lib/signalService';
import { usePathname } from 'next/navigation';

export default function SignalTracker() {
    const pathname = usePathname();
    const dwellTimes = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        // Track page view
        signalService.track({ event_type: 'VIEW', target: pathname });

        // Setup observer for sections
        const sections = document.querySelectorAll('[data-signal-section]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionId = entry.target.getAttribute('id') || entry.target.getAttribute('data-signal-section') || 'unknown';

                if (entry.isIntersecting) {
                    // User started looking at section
                    dwellTimes.current.set(sectionId, Date.now());
                } else {
                    // User scrolled away
                    const startTime = dwellTimes.current.get(sectionId);
                    if (startTime) {
                        const duration = Date.now() - startTime;
                        if (duration > 1000) { // Only track if dwell > 1s
                            signalService.track({
                                event_type: 'DWELL',
                                target: sectionId,
                                metadata: { duration_ms: duration }
                            });
                        }
                        dwellTimes.current.delete(sectionId);
                    }
                }
            });
        }, { threshold: 0.5 }); // 50% of section must be visible

        sections.forEach(section => observer.observe(section));

        const currentDwellTimes = dwellTimes.current;

        return () => {
            observer.disconnect();
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
        };
    }, [pathname]);

    return null; // Invisible component
}
