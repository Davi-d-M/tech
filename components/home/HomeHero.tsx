'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, ShieldCheck, Trophy, Sparkles, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/lib/useSettings";
import CountdownTimer from "./CountdownTimer";

export default function HomeHero() {
  const { settings } = useSettings();
  const promotions = settings.promotions;

  return (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden bg-white text-left">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-[10rem] -z-10 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full -z-10 blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">The New Era of Tech is Here</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground uppercase leading-[1.1] sm:leading-[0.9]">
              Future <span className="text-primary italic">Sound.</span><br />
              Total <span className="text-slate-400">Power.</span>
            </h1>

            {Boolean(promotions?.is_active) && promotions?.flash_sale_end && (
                <CountdownTimer targetDate={promotions.flash_sale_end as string} />
            )}

            <p className="text-lg text-slate-500 font-medium max-w-lg leading-relaxed">
              Experience authentic tech engineered for excellence. From premium AirPods to high-speed charging solutions, we power your digital lifestyle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/shop">
                <Button className="h-16 px-10 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all group">
                  Explore Catalog <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/shop/category/new-arrivals">
                <Button variant="outline" className="h-16 px-10 rounded-[1.5rem] border-2 border-slate-100 bg-white font-black uppercase tracking-widest text-xs hover:border-primary hover:text-primary transition-all">
                  New Arrivals
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-100">
                <div className="space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Zap className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-foreground">Fast Dispatch</p>
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-foreground">100% Authentic</p>
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <Trophy className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-foreground">Premium Tech</p>
                </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-in zoom-in-95 duration-1000 delay-200">
              <div className="aspect-square rounded-[4rem] bg-slate-50 border border-slate-100 flex items-center justify-center p-12 overflow-hidden shadow-inner group">
                  <div className="flex flex-col items-center gap-4 text-slate-200">
                      <Smartphone className="h-24 w-24 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">&quot;Upload Hero via Admin&quot;</p>
                  </div>

                  {/* Floating Price Tag */}
                  <div className="absolute bottom-10 right-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 animate-bounce delay-1000">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Starting from</p>
                      <p className="text-2xl font-black text-foreground tracking-tighter">Ksh 4,500</p>
                  </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          </div>

        </div>
      </div>
    </section>
  );
}
