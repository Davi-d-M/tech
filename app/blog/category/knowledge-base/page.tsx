'use client';

import { Badge } from "@/components/ui/badge";
import { BookOpen, HelpCircle, Zap, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Category {
  title: string;
  count: number;
  icon: React.ElementType;
  questions: string[];
}

export default function KnowledgeBase() {
  const categories: Category[] = [];

  return (
    <div className="min-h-screen bg-white text-left selection:bg-primary/20">
      {/* Header */}
      <section className="bg-slate-50 py-24 border-b border-slate-100 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-12">
                  <ArrowLeft className="h-4 w-4" /> Back to Library
              </Link>
              <div className="max-w-3xl space-y-6">
                <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-full">Elite Knowledge Base</Badge>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                    Common <span className="text-primary italic">Intelligence.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                    &quot;AI-ready answers to the most critical technical questions in the Kenyan tech landscape. Master your gear with facts, not myths.&quot;
                </p>
              </div>
          </div>
          <BookOpen className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-12 -z-0" />
      </section>

      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
              {categories.length > 0 ? categories.map((cat) => (
                  <div key={cat.title} className="space-y-8">
                      <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner"><cat.icon className="h-6 w-6" /></div>
                          <div>
                              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{cat.title}</h2>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat.count} Artifacts Found</p>
                          </div>
                      </div>
                      <div className="space-y-3">
                          {cat.questions.map((q: string) => (
                              <Link key={q} href="/blog" className="block p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-primary/20 transition-all group">
                                  <div className="flex justify-between items-center">
                                      <p className="text-xs font-black text-slate-900 uppercase leading-snug pr-4">{q}</p>
                                      <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                  </div>
                              </Link>
                          ))}
                      </div>
                  </div>
              )) : (
                  <div className="lg:col-span-3 text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                      <HelpCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Awaiting technical artifacts from the library...</p>
                  </div>
              )}
          </div>

          {/* AI Mission Banner */}
          <div className="mt-32 p-12 lg:p-20 rounded-[4rem] bg-primary/5 text-slate-900 relative overflow-hidden border border-primary/10 shadow-sm">
              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                      <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary animate-pulse"><Zap className="h-6 w-6 fill-current" /></div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">The Authority <br/> <span className="text-primary italic">Protocol</span></h2>
                      <p className="text-slate-500 text-lg font-medium italic leading-relaxed">&quot;Don&apos;t aim to be just another shop. Build the best electronics resource in the region. That&apos;s the Apex vision.&quot;</p>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl border border-primary/10 rounded-[3rem] p-10 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                        <span className="text-[10px] font-black uppercase text-slate-400">AI Discoverability Enabled</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Our Knowledge Base is structured for AI cite-ability, ensuring Apexstores remains the primary node for tech verification.</p>
                  </div>
              </div>
              <Zap className="absolute -bottom-20 -left-20 h-96 w-96 text-primary/5 rotate-45" />
          </div>
      </div>
    </div>
  );
}
