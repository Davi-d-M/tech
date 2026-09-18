import { supabase } from '@/lib/supabaseClient';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { Metadata } from 'next';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { withTimeout } from '@/lib/apexResilience';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Dynamic SEO for Gadget Pages
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let product: Product | null = null;

  if (supabase) {
    try {
        const { data } = await withTimeout(supabase
          .from('products')
          .select('name, description, image_url, image, price')
          .eq('id', id)
          .single());
        product = data as unknown as Product;
    } catch (e) {
        console.error("SEO metadata fetch stall:", e);
    }
  }

  // No Fallback
  if (!product) return { title: 'Product Not Found | Apexstores' };

  return {
    title: `${product.name} | Apexstores Tech Kenya`,
    description: product.description || `Buy authentic ${product.name} with Nairobi fast dispatch. Genuine tech and elite performance.`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: [(product.image_url || product.image || '/placeholder.jpg')],
      type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: product.name,
        images: [(product.image_url || product.image || '/placeholder.jpg')],
    }
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

  let product: Product | null = null;
  let related: Product[] = [];
  let reviewStats = { count: 0, rating: 5.0 };

  if (supabase) {
    try {
        // 1. Fetch main product from DB
        const { data: dbProd } = await withTimeout(supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single());
        product = dbProd as unknown as Product;

        if (dbProd) {
          // 2. Fetch real review stats
          const { data: revs } = await withTimeout(supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', id)
            .eq('is_hidden', false));

          if (revs && revs.length > 0) {
            reviewStats = {
              count: revs.length,
              rating: Number((revs.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / revs.length).toFixed(1))
            };
          }

          // 3. Fetch related products
          const { data: relatedData } = await withTimeout(supabase
            .from('products')
            .select('*')
            .eq('category', product.category || 'electronics')
            .neq('id', id)
            .limit(4));
          related = (relatedData || []).map((p) => ({
              ...(p as Record<string, unknown>),
              image_url: (p as Record<string, unknown>).image_url || '/placeholder.jpg'
          })) as unknown as Product[];
        }
    } catch (err) {
        console.error("Product page data fetch stall:", err);
    }
  }

  if (!product) return (
    <div className="min-h-[50dvh] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-black uppercase text-foreground">Gadget Not Found</h1>
        <p className="text-slate-500 mt-2">This item may have been removed or the data node timed out.</p>
        <Link href="/" className="mt-8">
            <button className="rounded-2xl px-10 h-14 bg-primary text-white font-black uppercase text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                Return to Store
            </button>
        </Link>
    </div>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org/",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
                { "@type": "ListItem", "position": 2, "name": "Shop", "item": `${baseUrl}/shop` },
                { "@type": "ListItem", "position": 3, "name": product.name, "item": `${baseUrl}/shop/${id}` }
              ]
            },
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name || 'Premium Gadget',
              "image": product.image_url ? [product.image_url, ...(Array.isArray(product.image_url) ? [product.image_url] : [])] : ['/placeholder.jpg'],
              "description": product.description || '',
              "brand": {
                "@type": "Brand",
                "name": "Apexstores Tech"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "KES",
                "price": product.price || 0,
                "availability": (product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "url": `${baseUrl}/shop/${id}`,
                "priceValidUntil": "2027-12-31"
              },
              "aggregateRating": reviewStats.count > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": reviewStats.rating,
                "reviewCount": reviewStats.count
              } : undefined
            }
          ])
        }}
      />
      <ProductDetailClient
          product={product}
          relatedProducts={related}
      />
    </>
  );
}
