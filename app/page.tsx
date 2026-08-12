import ProductList from "@/components/home/ProductList";
import DynamicHero from "@/components/home/DynamicHero";
import PromotionalBanner from "@/components/home/PromotionalBanner";
import PersonalizedFeed from "@/components/home/PersonalizedFeed";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { type StoreSettings } from "@/lib/useSettings";

export const revalidate = 60; // Revalidate every minute

interface Post {
  slug: string;
  image_url: string;
  title: string;
  excerpt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  description?: string;
  image_url?: string;
  image?: string;
  rating?: number;
  category?: string;
  stock?: number;
  sizes?: string[];
  is_new?: boolean;
}

export default async function Home() {
  // 1. Fetch All Data in Parallel on Server
  const [postsRes, productsRes, settingsRes] = await Promise.all([
    supabase?.from('blog_posts').select('*').eq('is_published', true).limit(2) || Promise.resolve({ data: [] }),
    supabase?.from('products').select('*').order('created_at', { ascending: false }) || Promise.resolve({ data: [] }),
    supabase?.from('settings').select('*') || Promise.resolve({ data: [] })
  ]);

  const posts = (postsRes.data || []) as Post[];
  const initialProducts = (productsRes.data || []) as Product[];

  // Process Settings
  const settingsData = settingsRes.data || [];
  const settings = {} as StoreSettings;
  settingsData.forEach(item => {
      (settings as unknown as Record<string, unknown>)[item.key] = item.value;
  });

  return (
    <div className="bg-white min-h-screen text-left">

      {/* 1. Premium Hero Section */}
      <DynamicHero initialSettings={settings} />

      {/* 2. Flash Sale Banner */}
      <PromotionalBanner />

      {/* 3. Collections Feed */}
      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 border-b border-slate-100 pb-10">
          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-full">
                Tech Catalog
            </Badge>
            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Latest Gadgets</h2>
            <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
              Precision engineered electronics designed to simplify your life. Discover the latest in authentic mobile technology.
            </p>
          </div>
          <div className="hidden md:block">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Scrolling Essentials — 2026 Batch</span>
          </div>
        </div>

        {/* 4. Product Grid & Filter Tabs */}
        <ProductList initialProducts={initialProducts} />

      </div>

      {/* 5. Personalized Feed (Memory) */}
      <PersonalizedFeed />

      {/* 6. Blog Teaser Section */}
      <section className="bg-slate-50 py-24 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-12">
                  <div className="space-y-3">
                      <Badge className="bg-primary/5 text-primary border-none font-black uppercase text-[9px] px-3 py-1 rounded-full">Tech Library</Badge>
                      <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Expert Guides</h2>
                  </div>
                  <Link href="/blog" className="text-[10px] font-black text-primary underline underline-offset-4 uppercase tracking-widest hover:text-foreground">Explore Library</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {posts.length > 0 ? posts.map((post) => (
                      <Link key={post.slug} href={`/blog/${post.slug}`} className="group relative rounded-[2.5rem] overflow-hidden bg-slate-100 aspect-[16/9] shadow-2xl transition-all hover:-translate-y-2 border border-slate-200">
                          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 overflow-hidden relative">
                              <Image
                                src={post.image_url || '/placeholder.jpg'}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                          </div>
                          <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-white/90 to-transparent">
                              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">{post.title}</h3>
                              <p className="text-slate-600 text-sm font-medium line-clamp-1">{post.excerpt}</p>
                          </div>
                      </Link>
                  )) : (
                      <div className="col-span-full py-16 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                          <BookOpen className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Awaiting technical artifacts from the library...</p>
                      </div>
                  )}
              </div>
          </div>
      </section>

      {/* 6. Fast Power CTA */}
      <section className="bg-slate-50 py-32 overflow-hidden relative border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <h2 className="text-5xl lg:text-8xl font-black text-foreground uppercase tracking-tighter mb-8 leading-[0.85]">
                  Need Fast <br /><span className="text-primary italic">Power?</span>
              </h2>
              <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                  Our authentic charging kits deliver 0-100% in record time. Safe, verified, and guaranteed for your device.
              </p>
              <div className="flex justify-center">
                  <Badge variant="outline" className="border-slate-200 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px] py-3 px-8 rounded-full animate-pulse">
                      Nairobi Instant Dispatch Active
                  </Badge>
              </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-[150px] -z-0"></div>
      </section>

    </div>
  );
}
