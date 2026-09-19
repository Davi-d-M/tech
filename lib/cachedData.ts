import { unstable_cache } from 'next/cache';
import { supabase } from './supabaseClient';
import { SettingsRow, Post, Product } from './types';
import { withTimeout } from './apexResilience';

export const getCachedSettings = unstable_cache(
  async (): Promise<{ data: SettingsRow[] }> => {
    if (!supabase) return { data: [] as SettingsRow[] };

    try {
        const result = await withTimeout(
            supabase.from('settings').select('*'),
            5000, // FAST FAIL: Only wait 5s for root settings
            'Root Settings Query'
        );
        return { data: (result.data as SettingsRow[]) || [] };
    } catch (e) {
        console.error("Cached Settings Recovery Protocol (Root):", e);
        return { data: [] as SettingsRow[] };
    }
  },
  ['store-settings-v5'],
  { revalidate: 60, tags: ['settings'] }
);

export const getCachedHomeData = unstable_cache(
  async (): Promise<[{ data: Post[] }, { data: Product[] }, { data: SettingsRow[] }]> => {
    if (!supabase) return [ { data: [] as Post[] }, { data: [] as Product[] }, { data: [] as SettingsRow[] } ];

    // Granular Recovery: Wrap each query individually so one stall doesn't kill the whole page
    const fetchPosts = async () => {
        try {
            const res = await withTimeout(supabase!.from('blog_posts').select('*').eq('is_published', true).limit(2), 10000, 'Blog Query');
            return { data: (res.data as Post[]) || [] };
        } catch (e) {
            console.warn("Home Data Recovery (Posts):", e);
            return { data: [] as Post[] };
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await withTimeout(supabase!.from('products').select('*').order('created_at', { ascending: false }), 12000, 'Products Query');
            return { data: (res.data as Product[]) || [] };
        } catch (e) {
            console.warn("Home Data Recovery (Products):", e);
            return { data: [] as Product[] };
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await withTimeout(supabase!.from('settings').select('*'), 10000, 'Settings Query');
            return { data: (res.data as SettingsRow[]) || [] };
        } catch (e) {
            console.warn("Home Data Recovery (Settings):", e);
            return { data: [] as SettingsRow[] };
        }
    };

    const results = await Promise.all([fetchPosts(), fetchProducts(), fetchSettings()]);
    return results as [{ data: Post[] }, { data: Product[] }, { data: SettingsRow[] }];
  },
  ['home-data-v5'],
  { revalidate: 60, tags: ['products', 'settings'] }
);
