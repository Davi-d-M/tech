import { unstable_cache } from 'next/cache';
import { supabase } from './supabaseClient';

export const getCachedSettings = unstable_cache(
  async () => {
    if (!supabase) return { data: [] };
    const { data } = await supabase.from('settings').select('*');
    return { data: data || [] };
  },
  ['store-settings-v3'],
  { revalidate: 60, tags: ['settings'] } // Overclock: 1 min cache
);

export const getCachedHomeData = unstable_cache(
  async () => {
    if (!supabase) return [ { data: [] }, { data: [] }, { data: [] } ];
    return await Promise.all([
      supabase.from('blog_posts').select('*').eq('is_published', true).limit(2),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*')
    ]);
  },
  ['home-data-v3'],
  { revalidate: 60, tags: ['products', 'settings'] } // Overclock: 1 min cache
);
