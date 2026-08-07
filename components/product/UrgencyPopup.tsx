'use client';

import { useState, useEffect } from 'react';
import { Flame, Zap } from 'lucide-react';

export default function UrgencyPopup({ stock }: { stock: number }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show after 3 seconds
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-700">
            {stock > 0 && stock <= 10 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
                    <Zap className="h-4 w-4 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        High Demand: Only {stock} units left in stock!
                    </span>
                </div>
            )}
        </div>
    );
}
