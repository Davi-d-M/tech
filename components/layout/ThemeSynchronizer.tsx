'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ThemeSynchronizer() {
    React.useEffect(() => {
        async function syncTheme() {
            if (!supabase) return;
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
        }

        syncTheme();
        // Listen for auth changes to re-sync
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(() => {
            syncTheme();
        });

        return () => subscription.unsubscribe();
    }, []);

    return null; // Side-effect only component
}
