import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://apexstores.co.ke';

  if (!supabase) return [];

  try {
      // 1. Fetch Products
      const { data: products } = await supabase
          .from('products')
          .select('id, updated_at');

      // 2. Fetch Blog Posts
      const { data: posts } = await supabase
          .from('blog_posts')
          .select('slug, updated_at')
          .eq('is_published', true);

      const staticRoutes: MetadataRoute.Sitemap = [
          '',
          '/shop',
          '/blog',
          '/warranty',
          '/about',
          '/contact'
      ].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));

      const productRoutes: MetadataRoute.Sitemap = (products || []).map(p => ({
        url: `${baseUrl}/product/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      }));

      const postRoutes: MetadataRoute.Sitemap = (posts || []).map(p => ({
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }));

      return [...staticRoutes, ...productRoutes, ...postRoutes];
  } catch (err) {
      console.error("Sitemap generation error:", err);
      return [];
  }
}
