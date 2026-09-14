import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

  if (!supabase) return [];

  try {
      // 1. Fetch Products
      const { data: products } = await supabase
          .from('products')
          .select('id, updated_at')
          .eq('status', 'Live');

      // 2. Fetch Blog Posts
      const { data: posts } = await supabase
          .from('blog_posts')
          .select('slug, updated_at')
          .eq('is_published', true);

      // 3. Fetch Distinct Categories
      const { data: categories } = await supabase
          .from('products')
          .select('category')
          .not('category', 'is', null);

      const uniqueCategories = Array.from(new Set((categories || []).map(c => c.category)));

      const staticRoutes: MetadataRoute.Sitemap = [
          '',
          '/shop',
          '/blog',
          '/warranty',
          '/about',
          '/contact',
          '/rewards'
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

      const categoryRoutes: MetadataRoute.Sitemap = uniqueCategories.map(cat => ({
          url: `${baseUrl}/shop/category/${cat}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7
      }));

      return [...staticRoutes, ...productRoutes, ...postRoutes, ...categoryRoutes];
  } catch (err) {
      console.error("Sitemap generation error:", err);
      return [];
  }
}
