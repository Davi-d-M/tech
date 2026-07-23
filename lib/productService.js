import { createClient } from '@supabase/supabase-js';
import products from '@/data/products.json';

const DEFAULT_SIZES = ['38', '39', '40', '41', '42'];

function looksConfigured(value) {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('your-') && !value.includes('placeholder');
}

function normalizeCatalogItem(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || 'Premium gadget curated for quality and performance.',
    price: Number(item.price) || 0,
    image_url: item.image_url || item.image || '',
    sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : DEFAULT_SIZES,
  };
}

function getLocalCatalog() {
  return products.map((product) =>
    normalizeCatalogItem({
      ...product,
      image_url: product.image,
      sizes: DEFAULT_SIZES,
    })
  );
}

export async function getApexCatalog() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!looksConfigured(url) || !looksConfigured(key)) {
    return getLocalCatalog();
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Unable to load products from Supabase:', error.message);
      return getLocalCatalog();
    }

    if (!Array.isArray(data) || data.length === 0) {
      return getLocalCatalog();
    }

    return data.map((item) => normalizeCatalogItem(item));
  } catch (error) {
    console.warn('Falling back to local product catalog:', error);
    return getLocalCatalog();
  }
}

export default getApexCatalog;