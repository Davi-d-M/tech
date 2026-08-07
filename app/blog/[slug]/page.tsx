'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Share2, Zap, ShieldCheck } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  author: string;
  created_at: string;
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadPost() {
      if (!supabase || !slug) return;
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          router.push('/blog');
          return;
        }
        setPost(data as BlogPost);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Awaiting Content...</p>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white text-left pb-24">
      <main className="max-w-4xl mx-auto px-4 pt-12 sm:px-6 lg:px-8">

        <Link href="/blog" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2 mb-12">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>

        <header className="space-y-8 mb-16">
            <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-primary">
                <span className="bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">Expert Guide</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-2 text-slate-400"><Calendar className="h-3 w-3" /> {new Date(post.created_at).toLocaleDateString()}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-foreground uppercase tracking-tighter leading-none">
                {post.title}
            </h1>

            <p className="text-xl text-slate-500 font-medium italic border-l-4 border-primary/20 pl-6 py-2">
                {post.excerpt}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-primary text-xs font-black shadow-inner uppercase">
                        {post.author.substring(0, 2)}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{post.author}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Certified Tech Analyst</p>
                    </div>
                </div>
                <button className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
                    <Share2 className="h-4 w-4" />
                </button>
            </div>
        </header>

        <div className="rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl mb-16">
            <img src={post.image_url} alt={post.title} className="w-full h-auto" />
        </div>

        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-strong:text-foreground text-slate-600 font-medium leading-relaxed mb-24">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Footer Trust Badges */}
        <section className="bg-slate-50 rounded-[2.5rem] p-12 flex flex-col sm:flex-row gap-12 items-center justify-between border border-slate-100 shadow-inner">
            <div className="flex-1 text-center sm:text-left space-y-4">
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Powering Your Tech Journey</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">At Apexstores Tech, we don&apos;t just sell gadgets—we test them. All information provided in our guides is verified by elite hardware analysts.</p>
            </div>
            <div className="flex gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-primary shadow-xl border border-slate-100"><Zap className="h-8 w-8" /></div>
                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-emerald-500 shadow-xl border border-slate-100"><ShieldCheck className="h-8 w-8" /></div>
            </div>
        </section>

      </main>
    </div>
  );
}
