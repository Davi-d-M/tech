import { supabase } from '@/lib/supabaseClient';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { Metadata } from 'next';
import { Product } from '@/types/product';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Dynamic SEO for Gadget Pages
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let product: Record<string, unknown> | null = null;

  if (supabase) {
    const { data } = await supabase
      .from('products')
      .select('name, description, image_url, price')
      .eq('id', id)
      .single();
    product = data;
  }

  // No Fallback
  if (!product) return { title: 'Product Not Found | Apexstores' };

  return {
    title: `${product.name} | Apexstores Tech Kenya`,
    description: product.description || `Buy authentic ${product.name} with Nairobi fast dispatch. Genuine tech and elite performance.`,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image_url || product.image],
      type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: product.name,
        images: [product.image_url || product.image],
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
    // 1. Fetch main product from DB
    const { data: dbProd } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    product = dbProd as unknown as Product;

    if (dbProd) {
      // 2. Fetch real review stats
      const { data: revs } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', id)
        .eq('is_hidden', false);

      if (revs && revs.length > 0) {
        reviewStats = {
          count: revs.length,
          rating: Number((revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1))
        };
      }
    }
  }

  // No Fallback

  if (!product) return (
    <div className="min-h-[50dvh] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-black uppercase text-foreground">Gadget Not Found</h1>
        <p className="text-slate-500 mt-2">This item may have been removed from the catalog.</p>
    </div>
  );

  // 3. Fetch related products
  if (supabase) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', product.category || 'electronics')
      .neq('id', id)
      .limit(4);
    related = (data || []).map((p) => ({
        ...(p as Record<string, unknown>),
        image_url: (p as Record<string, unknown>).image_url || '/placeholder.jpg'
    })) as unknown as Product[];
  }

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
