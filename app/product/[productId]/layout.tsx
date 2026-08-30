import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.productId;

  // Fetch product data directly from DB (Server Side)
  if (!supabase) return { title: 'Service Unavailable | Apexstores' };

  const { data: product } = await supabase
    .from('products')
    .select('name, description, image_url, price')
    .eq('id', id)
    .single();

  if (!product) return { title: 'Product Not Found | Apexstores' };

  return {
    title: `${product.name} | Apexstores Elite Tech`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image_url],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image_url],
    }
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
