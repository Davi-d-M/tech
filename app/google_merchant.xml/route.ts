import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!supabase) {
    return new NextResponse('Supabase not configured', { status: 500 });
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('hide_product', false);

  if (error) {
    return new NextResponse('Error fetching products', { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Apexstores | Elite Tech Kenya</title>
    <link>${baseUrl}</link>
    <description>Authentic AirPods, high-speed chargers, and elite phone accessories in Nairobi.</description>
    ${products?.map(product => `
    <item>
      <g:id>${product.id}</g:id>
      <g:title>${product.name}</g:title>
      <g:description>${product.description?.replace(/<[^>]*>?/gm, '') || 'Premium tech essential'}</g:description>
      <g:link>${baseUrl}/product/${product.id}</g:link>
      <g:image_link>${product.image_url}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${product.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${product.price} KES</g:price>
      <g:brand>${product.brand || 'Apexstores'}</g:brand>
      <g:google_product_category>Electronics &gt; Communications &gt; Telephony &gt; Mobile Phone Accessories</g:google_product_category>
    </item>`).join('')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
