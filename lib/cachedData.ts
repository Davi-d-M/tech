import { unstable_cache } from 'next/cache';
import { supabase } from './supabaseClient';
import { SettingsRow } from './useSettings';

/**
 * Apex Resilience: Utility to execute a promise with a timeout and clean up timers.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('DB_TIMEOUT')), timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutHandle!);
        return result;
    } catch (error) {
        clearTimeout(timeoutHandle!);
        throw error;
    }
}

export const getCachedSettings = unstable_cache(
  async (): Promise<{ data: SettingsRow[] }> => {
    if (!supabase) return { data: [] };

    try {
        const result = await withTimeout(supabase.from('settings').select('*'));
        return { data: (result.data as SettingsRow[]) || [] };
    } catch (e) {
        console.error("Cached Settings Timeout/Error:", e);
        return { data: [] };
    }
  },
  ['store-settings-v5'],
  { revalidate: 60, tags: ['settings'] }
);

export const getCachedHomeData = unstable_cache(
  async (): Promise<[{ data: any[] }, { data: any[] }, { data: SettingsRow[] }]> => {
    if (!supabase) return [ { data: [] }, { data: [] }, { data: [] } ];

    try {
        return await withTimeout(Promise.all([
            supabase.from('blog_posts').select('*').eq('is_published', true).limit(2),
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('settings').select('*')
        ])) as any;
    } catch (e) {
        console.error("Cached Home Data Timeout/Error:", e);
        return [ { data: [] }, { data: [] }, { data: [] } ];
    }
  },
  ['home-data-v5'],
  { revalidate: 60, tags: ['products', 'settings'] }
);
