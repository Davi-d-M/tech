'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ThemeSynchronizer() {
    React.useEffect(() => {
        async function syncTheme() {
            if (!supabase) return;
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('loyalty_points')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profile) {
                        const pts = profile.loyalty_points || 0;
                        const html = document.documentElement;

                        if (pts >= 5000) {
                            html.setAttribute('data-theme', 'noir');
                        } else if (pts >= 1000) {
                            html.setAttribute('data-theme', 'titanium');
                        } else {
                            html.removeAttribute('data-theme');
                        }
                    }
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
            } catch (err) {
                console.warn("Theme Sync inhibited:", err);
            }
        }

        syncTheme();
        // Listen for auth changes to re-sync
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            syncTheme().catch(() => {});
        });

        return () => subscription.unsubscribe();
    }, []);

    return null; // Side-effect only component
}
