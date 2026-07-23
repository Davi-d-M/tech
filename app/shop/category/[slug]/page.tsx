import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/home/ProductCard';

interface CategoryPageProps {
  params: any;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  const categorySlug = slug.toLowerCase();

  let products: any[] = [];
  let fetchError: any = null;

  if (supabase && categorySlug) {
    try {
      // 1. Try fetching with specific filters
      let query = supabase.from('products').select('*');

      if (categorySlug === 'new-arrivals') {
        query = query.eq('is_new', true);
      } else if (categorySlug === 'sale') {
        query = query.not('old_price', 'is', null);
      } else if (categorySlug === 'featured') {
        query = query.eq('is_featured', true);
      } else {
        query = query.eq('category', categorySlug);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn(`Initial fetch failed for category "${categorySlug}":`, error.message);

        // 2. Defensive Fallback: If column doesn't exist, fetch all and filter in memory if possible
        if (error.message.includes('does not exist')) {
           console.log('Retrying with simple query due to missing columns...');
           const { data: allData, error: allErr } = await supabase.from('products').select('*');

           if (!allErr && allData) {
              if (categorySlug === 'sale') {
                  products = allData.filter(p => p.old_price && Number(p.old_price) > Number(p.price));
              } else if (categorySlug === 'new-arrivals') {
                  products = allData.filter(p => p.is_new === true);
              } else if (categorySlug === 'featured') {
                  products = allData.filter(p => p.is_featured === true);
              } else {
                  products = allData.filter(p => p.category?.toLowerCase() === categorySlug);
              }
           } else {
              fetchError = allErr || { message: "Database connection issue" };
           }
        } else {
           fetchError = error;
        }
      } else {
        // Handle 'sale' memory filter if needed
        if (categorySlug === 'sale' && data) {
          products = data.filter(p => p.old_price && Number(p.old_price) > Number(p.price));
        } else {
          products = data || [];
        }
      }
    } catch (err) {
      console.error('Category page logic crash:', err);
      fetchError = { message: "Internal application error" };
    }
  }

  const displayTitle = categorySlug
    ? categorySlug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Gadgets';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-left min-h-screen bg-white">
      <div className="border-b border-slate-100 pb-8 mb-12">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
          {displayTitle} {!displayTitle.toLowerCase().includes('arrivals') && 'Items'}
        </h1>
        <p className="mt-2 text-slate-500 font-medium">
          Discover our curated collection of premium gadgets and tech accessories.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={{
              id: product.id,
              name: product.name,
              price: product.price,
              old_price: product.old_price,
              description: product.description,
              image: product.image_url,
              stock: product.stock,
              sizes: product.sizes,
              is_new: product.is_new,
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
          <p className="text-slate-400 text-lg font-bold uppercase tracking-widest px-6">
            {fetchError ? "Please check your Supabase database schema." : `No items found in ${displayTitle}.`}
          </p>
          <div className="flex flex-col items-center gap-4 mt-8">
            <Link href="/">
                <button className="rounded-2xl px-10 py-4 bg-slate-900 text-white font-black uppercase text-xs shadow-lg hover:opacity-90 transition-all">
                    Back to homepage
                </button>
            </Link>
            {fetchError && (
                <p className="text-[10px] text-rose-500 font-bold max-w-md bg-rose-50 p-2 rounded-lg">
                    Error: {fetchError.message}
                </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
