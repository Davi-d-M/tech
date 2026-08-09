'use client';

import { useSettings } from "@/lib/useSettings";
import { Button } from "@/components/ui/button";
import { Zap, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import CountdownTimer from "./CountdownTimer";

export default function PromotionalBanner() {
  const { settings } = useSettings();

  const promo = settings.promotions || { flash_sale_text: 'Flash Sale: 20% OFF All Tech!', discount_percent: 20, is_active: true, flash_sale_end: '' };

  const saleEndDate = promo.flash_sale_end || new Date(new Date().getTime() + 48 * 60 * 60 * 1000).toISOString();

  if (!promo.is_active) return null;

  return (
    <div className="bg-primary mx-4 sm:mx-8 lg:mx-12 my-8 rounded-[3rem] p-8 lg:p-12 overflow-hidden relative shadow-2xl shadow-primary/20 animate-in fade-in zoom-in-95 duration-700">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 text-center lg:text-left max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white">
                    <Zap className="h-4 w-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Flash Sale Active</span>
                </div>
                <h2 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                    {(promo?.flash_sale_text || '').split(':')?.[0] || 'Flash Sale'} <br />
                    <span className="text-white/80 italic">{(promo?.flash_sale_text || '').split(':')?.[1] || ''}</span>
                </h2>
                <p className="text-white/80 text-lg font-medium">Limited batch arrival. Authenticity guaranteed. Nairobi fast dispatch active.</p>
                <Link href="/shop/category/sale">
                  <Button className="h-14 px-8 rounded-2xl bg-white text-primary font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 group shadow-xl">
                      Claim Deal <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
            </div>

            <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Offer Expiring In:
                </p>
                <CountdownTimer targetDate={saleEndDate} />
            </div>
        </div>

        {/* Subtle Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -z-0"></div>
    </div>
  );
}
