'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getTierFromPoints, TIER_THEMES, CustomerTier } from '@/lib/apex-os/tiers';

export default function TierThemeNode() {
    const [tier, setTier] = React.useState<CustomerTier>('Bronze');

    React.useEffect(() => {
        if (!supabase) return;

        async function fetchUserTier() {
            if (!supabase) return;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('loyalty_points')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (data) {
                        setTier(getTierFromPoints(data.loyalty_points || 0));
                    }
                }
            } catch (err) {
                console.warn("Tier Node Sync inhibited:", err);
            }
        }

        fetchUserTier();

        // Listen for Auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUserTier().catch(() => {});
        });

        return () => subscription.unsubscribe();
    }, []);

    React.useEffect(() => {
        const theme = TIER_THEMES[tier];
        // Apply CSS Variables to Document Root
        document.documentElement.style.setProperty('--tier-primary', theme.primary);

        // Optional: Apply a class to body for easier tailwind targeting
        document.body.classList.remove('tier-bronze', 'tier-gold', 'tier-platinum');
        document.body.classList.add(`tier-${tier.toLowerCase()}`);

    }, [tier]);

    return null; // Silent logic node
}
