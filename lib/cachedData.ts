import { unstable_cache } from 'next/cache';
import { supabase } from './supabaseClient';
import { SettingsRow, Post, Product } from './types';
import { withTimeout } from './apexResilience';

export const getCachedSettings = unstable_cache(
  async (): Promise<{ data: SettingsRow[] }> => {
    if (!supabase) return { data: [] as SettingsRow[] };

    try {
        const result = await withTimeout(supabase.from('settings').select('*'));
        return { data: (result.data as SettingsRow[]) || [] };
    } catch (e) {
        console.error("Cached Settings Timeout/Error:", e);
        return { data: [] as SettingsRow[] };
    }
  },
  ['store-settings-v5'],
  { revalidate: 60, tags: ['settings'] }
);

export const getCachedHomeData = unstable_cache(
  async (): Promise<[{ data: Post[] }, { data: Product[] }, { data: SettingsRow[] }]> => {
    if (!supabase) return [ { data: [] as Post[] }, { data: [] as Product[] }, { data: [] as SettingsRow[] } ];

    try {
        const result = await withTimeout(Promise.all([
            supabase.from('blog_posts').select('*').eq('is_published', true).limit(2),
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('settings').select('*')
        ]));
        return result as [{ data: Post[] }, { data: Product[] }, { data: SettingsRow[] }];
    } catch (e) {
        console.error("Cached Home Data Timeout/Error:", e);
        return [ { data: [] as Post[] }, { data: [] as Product[] }, { data: [] as SettingsRow[] } ];
    }
  },
  ['home-data-v5'],
  { revalidate: 60, tags: ['products', 'settings'] }
);
