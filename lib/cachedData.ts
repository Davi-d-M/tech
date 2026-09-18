import { unstable_cache } from 'next/cache';
import { supabase } from './supabaseClient';

export const getCachedSettings = unstable_cache(
  async () => {
    if (!supabase) return { data: [] };

    // Apex Resilience: 10s Timeout for DB fetch
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 10000));

    try {
        const result = await Promise.race([
            supabase.from('settings').select('*'),
            timeout
        ]) as { data: any[] | null };

        return { data: result.data || [] };
    } catch (e) {
        console.error("Cached Settings Timeout/Error:", e);
        return { data: [] };
    }
  },
  ['store-settings-v4'],
  { revalidate: 60, tags: ['settings'] }
);

export const getCachedHomeData = unstable_cache(
  async () => {
    if (!supabase) return [ { data: [] }, { data: [] }, { data: [] } ];

    // Apex Resilience: 10s Timeout for Parallel DB fetch
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 10000));

    try {
        return await Promise.race([
            Promise.all([
                supabase.from('blog_posts').select('*').eq('is_published', true).limit(2),
                supabase.from('products').select('*').order('created_at', { ascending: false }),
                supabase.from('settings').select('*')
            ]),
            timeout
        ]) as any;
    } catch (e) {
        console.error("Cached Home Data Timeout/Error:", e);
        return [ { data: [] }, { data: [] }, { data: [] } ];
    }
  },
  ['home-data-v4'],
  { revalidate: 60, tags: ['products', 'settings'] }
);
