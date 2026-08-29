'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, ShieldCheck, Trophy, Sparkles, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSettings, type StoreSettings } from "@/lib/useSettings";
import { formatPrice } from "@/lib/utils";

import Image from "next/image";

export default function DynamicHero({ initialSettings }: { initialSettings?: StoreSettings }) {
  const { settings: hookSettings } = useSettings();

  const settings = initialSettings || hookSettings;

  return (
    <section className="relative pt-8 pb-12 lg:pt-20 lg:pb-32 overflow-hidden bg-white text-left">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-primary/5 rounded-l-none lg:rounded-l-[10rem] -z-10 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full -z-10 blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 lg:h-4 w-4 text-primary animate-pulse" />
                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {settings?.homepage?.hero_badge_text || 'Elite Tech Protocol'}
                </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground uppercase leading-[0.9]">
                <>
                {(settings?.branding?.hero_title || '').split('.')?.[0] || 'Premium Tech'}. <br />
                <span className="text-primary italic">{(settings?.branding?.hero_title || '').split('.')?.[1] || ''}</span>
                </>
            </h1>

            <p className="text-base lg:text-lg text-slate-500 font-medium max-w-lg leading-relaxed">
              {settings?.branding?.hero_subtitle || 'Experience authentic tech engineered for excellence.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 lg:pt-4">
              <Link href="/shop">
                <Button className="h-14 lg:h-16 px-8 lg:px-10 rounded-2xl lg:rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-[10px] lg:text-xs shadow-xl hover:bg-primary/90 transition-all active:scale-95 shadow-primary/20 group w-full sm:w-auto">
                  Explore Catalog <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/shop/category/new-arrivals">
                <Button variant="outline" className="h-14 lg:h-16 px-8 lg:px-10 rounded-2xl lg:rounded-[1.5rem] border-2 border-slate-100 bg-white font-black uppercase tracking-widest text-[10px] lg:text-xs hover:border-primary hover:text-primary transition-all active:scale-95 w-full sm:w-auto">
                  New Arrivals
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 lg:gap-6 pt-8 lg:pt-12 border-t border-slate-100">
                <div className="space-y-2">
                    <div className="h-7 w-7 lg:h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Zap className="h-3.5 w-3.5 lg:h-4 w-4" />
                    </div>
                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-tighter text-foreground">Fast Dispatch</p>
                </div>
                <div className="space-y-2">
                    <div className="h-7 w-7 lg:h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="h-3.5 w-3.5 lg:h-4 w-4" />
                    </div>
                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-tighter text-foreground">100% Authentic</p>
                </div>
                <div className="space-y-2">
                    <div className="h-7 w-7 lg:h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <Trophy className="h-3.5 w-3.5 lg:h-4 w-4" />
                    </div>
                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-tighter text-foreground">Elite Tech</p>
                </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-in zoom-in-95 duration-1000 delay-200">
              <div className="aspect-square rounded-3xl lg:rounded-[4rem] bg-slate-50 border border-slate-100 flex items-center justify-center p-8 lg:p-12 overflow-hidden shadow-inner group relative">
                  {settings?.homepage?.hero_image_url ? (
                      <Image
                        src={settings.homepage.hero_image_url}
                        alt="Hero"
                        fill
                        priority={true}
                        fetchPriority="high"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain transform group-hover:scale-110 transition-transform duration-700"
                      />
                  ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-200">
                          <Smartphone className="h-24 w-24 lg:h-32 lg:w-32 opacity-10 animate-pulse text-primary" />
                          <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                              {settings?.homepage?.hero_visual_label || "Apex Premium Series"}
                          </p>
                      </div>
                  )}

                  {/* Floating Price Tag */}
                  <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-2xl border border-slate-50 animate-bounce delay-1000">
                      <p className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 mb-0.5 lg:mb-1">Starting from</p>
                      <p className="text-xl lg:text-2xl font-black text-foreground tracking-tighter">
                          {formatPrice(settings?.homepage?.hero_starting_price || 1500)}
                      </p>
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
