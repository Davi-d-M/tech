import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import ProductClient from './ProductClient';
import ProductNotFound from '@/components/product/ProductNotFound';
import { Product as ProductType } from '@/lib/types';

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata(
  { params }: ProductPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.productId;

  if (!supabase) return {};

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found | Apexstores',
    };
  }

  const typedProduct = product as ProductType;
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${typedProduct.name} | Buy Online in Kenya | Apexstores`,
    description: typedProduct.seo_description || typedProduct.short_description || typedProduct.description?.substring(0, 160),
    keywords: [...(typedProduct.seo_keywords || []), typedProduct.category || '', 'Nairobi Tech'],
    alternates: {
      canonical: typedProduct.canonical_url || `${process.env.NEXT_PUBLIC_BASE_URL}/product/${id}`,
    },
    openGraph: {
      title: typedProduct.name,
      description: typedProduct.short_description || typedProduct.description?.substring(0, 160),
      images: [typedProduct.image_url || typedProduct.image || '', ...previousImages],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.productId;

  if (!supabase) return <ProductNotFound />;

  // Fetch data server-side
  const [productRes, reviewsRes, blogRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('reviews').select('rating').eq('product_id', id).eq('is_hidden', false),
    supabase.from('blog_posts').select('title, slug, excerpt').eq('is_published', true).limit(2)
  ]);

  if (!productRes.data) return <ProductNotFound />;

  const product = productRes.data as ProductType;
  const reviews = reviewsRes.data || [];
  const reviewStats = {
    count: reviews.length,
    rating: reviews.length > 0
        ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
        : product.rating || 5.0
  };

  return (
    <ProductClient
      product={product}
      reviewStats={reviewStats}
      tutorials={blogRes.data || []}
    />
  );
}
