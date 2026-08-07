import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

  // 1. Fetch live products
  const { data: products } = await supabase!
    .from('products')
    .select('id, updated_at')
    .eq('hide_product', false);

  // 2. Fetch live blog posts
  const { data: posts } = await supabase!
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('is_published', true);

  const staticPages = [
    '',
    '/shop',
    '/blog',
    '/contact',
    '/about',
    '/track',
    '/warranty',
    '/returns',
    '/shipping',
    '/privacy',
    '/terms'
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((page) => `
    <url>
      <loc>${baseUrl}${page}</url>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>`)
    .join('')}
  ${(products || [])
    .map((p) => `
    <url>
      <loc>${baseUrl}/shop/${p.id}</url>
      <lastmod>${new Date(p.updated_at || Date.now()).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>`)
    .join('')}
  ${(posts || [])
    .map((post) => `
    <url>
      <loc>${baseUrl}/blog/${post.slug}</loc>
      <lastmod>${new Date(post.updated_at || Date.now()).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`)
    .join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
