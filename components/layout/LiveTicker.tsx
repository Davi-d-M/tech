'use client';

import { useEffect, useState, useMemo } from 'react';
import { Sparkles, Truck, Gift, TrendingUp, Zap, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/useSettings';

interface TickerItem {
    text: string;
    icon: React.ElementType;
}

const DEFAULT_TICKER: TickerItem[] = [];

export default function LiveTicker() {
    const { settings } = useSettings();
    const promotions = (settings as { promotions?: { is_active?: boolean; flash_sale_text?: string } }).promotions || {};
    const [currentIndex, setCurrentIndex] = useState(0);

    const tickerItems = useMemo(() => {
        const items = [...DEFAULT_TICKER];
        if (promotions.is_active && promotions.flash_sale_text) {
            items.unshift({ text: promotions.flash_sale_text, icon: Megaphone });
        }
        return items;
    }, [promotions.is_active, promotions.flash_sale_text]);

    useEffect(() => {
        if (tickerItems.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tickerItems]);

    return (
        <div className="bg-slate-50 text-slate-900 overflow-hidden py-2 border-b border-slate-100">
            <div className="container mx-auto px-4 flex justify-center items-center h-6">
                {tickerItems.map((item, index) => (
                    <div
                        key={index}
                        className={cn(
                            "absolute flex items-center gap-3 transition-all duration-1000 ease-in-out whitespace-nowrap",
                            index === currentIndex
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-4 pointer-events-none"
                        )}
                    >
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
  );
}
