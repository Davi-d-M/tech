import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    if (!supabase) return new Response("Supabase Offline", { status: 500 });

    const baseUrl = 'https://apexstores.co.ke';

    // 1. Fetch Products
    const { data: products } = await supabase
        .from('products')
        .select('id, updated_at');

    // 2. Fetch Blog Posts
    const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('is_published', true);

    const staticRoutes = [
        '',
        '/shop',
        '/blog',
        '/warranty',
        '/about',
        '/contact'
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${staticRoutes.map(route => `
            <url>
                <loc>${baseUrl}${route}</loc>
                <changefreq>daily</changefreq>
                <priority>0.8</priority>
            </url>
        `).join('')}
        ${products?.map(p => `
            <url>
                <loc>${baseUrl}/product/${p.id}</loc>
                <lastmod>${new Date(p.updated_at).toISOString()}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>1.0</priority>
            </url>
        `).join('')}
        ${posts?.map(p => `
            <url>
                <loc>${baseUrl}/blog/${p.slug}</loc>
                <lastmod>${new Date(p.updated_at).toISOString()}</lastmod>
                <changefreq>monthly</changefreq>
                <priority>0.6</priority>
            </url>
        `).join('')}
    </urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
