'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  author: string;
  created_at: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        setPosts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Opening Library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-left">
      {/* Hero Header */}
      <section className="bg-slate-50 py-24 border-b border-slate-100 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <Badge className="mb-6 bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-full">Apex Library</Badge>
              <h1 className="text-5xl lg:text-7xl font-black text-foreground uppercase tracking-tighter leading-none mb-8">
                  Tech <span className="text-primary italic">Guides.</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
                  Master your gadgets with our elite tutorials, hardware reviews, and authenticity guides for Kenyan tech enthusiasts.
              </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0"></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
            <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">New guides are being written...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <article className="space-y-6">
                  <div className="aspect-[16/10] rounded-[2.5rem] bg-slate-50 overflow-hidden border border-slate-100 shadow-sm relative group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/50">
                          Tech Tips
                      </div>
                  </div>
                  <div className="px-2 space-y-3">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(post.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {post.author}</span>
                    </div>
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{post.title}</h2>
                    <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed italic">{post.excerpt}</p>
                    <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary group-hover:gap-4 transition-all">
                        Read Full Guide <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA section */}
      <section className="bg-slate-50 py-24 text-center text-foreground border-t border-slate-100">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Want the latest tech news?</h2>
          <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">Join 1,000+ shoppers getting weekly elite gadget tips.</p>
          <div className="flex justify-center">
              <Button
                onClick={() => document.getElementById('footer-newsletter')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                Subscribe Now
              </Button>
          </div>
      </section>
    </div>
  );
}
