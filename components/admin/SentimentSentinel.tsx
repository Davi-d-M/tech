'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    AlertCircle,
    TrendingDown,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SentimentSentinel() {
    const [hotIssues, setHotIssues] = React.useState<{ id: number; type: string; body: string }[]>([]);
    const [temperature, setTemperature] = React.useState(98.6); // Base body temp

    React.useEffect(() => {
        async function checkSentiment() {
            if (!supabase) return;
            // Scan for Negative sentiment in Open items
            const { data: messages } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(20);
            const { data: reviews } = await supabase.from('reviews').select('*').is('admin_response', null).lte('rating', 2);

            const negative = [
                ...(messages || []).map((t: { id: number; message: string }) => ({ id: t.id, type: 'Support', body: t.message })),
                ...(reviews || []).map((r: { id: number; comment: string }) => ({ id: r.id, type: 'Review', body: r.comment }))
            ].filter(item => {
                const lower = item.body.toLowerCase();
                return lower.includes('bad') || lower.includes('delay') || lower.includes('angry') || lower.includes('worst') || lower.includes('broken');
            });

            setHotIssues(negative.slice(0, 2));
            setTemperature(98.6 + (negative.length * 2.5));
        }
        checkSentiment();
        const interval = setInterval(checkSentiment, 60000);
        return () => clearInterval(interval);
    }, []);

    if (hotIssues.length === 0) return null;

    return (
        <Card className="p-8 rounded-[3rem] bg-rose-600 text-white border-none shadow-2xl shadow-rose-500/30 animate-in zoom-in-95 duration-500 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6 text-left">
                    <div className="h-16 w-16 rounded-[1.8rem] bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                        <TrendingDown className="h-8 w-8 text-white animate-bounce" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Sentinel: Vibe Check</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mt-1">Brand Temperature: <span className={cn(temperature > 100 ? "text-white" : "text-white/60")}>{temperature.toFixed(1)}°F</span></p>
                        <p className="text-[10px] font-medium opacity-70 italic mt-2">&quot;Negative customer sentiment detected in the extraction grid.&quot;</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 flex-1 w-full max-w-md">
                    {hotIssues.map((issue, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/10 border border-white/10 flex justify-between items-center group/issue hover:bg-white/20 transition-all">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={14} className="text-white" />
                                <p className="text-[10px] font-black uppercase truncate max-w-[200px]">{issue.type}: &quot;{issue.body}&quot;</p>
                            </div>
                            <Link href="/admin/support/vip-relay">
                                <ChevronRight size={14} className="group-hover/issue:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ))}
                </div>

                <Link href="/admin/support/vip-relay">
                    <Button className="h-14 px-8 rounded-2xl bg-white text-rose-600 font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                        VIP Relay <ArrowRight size={14} className="ml-2" />
                    </Button>
                </Link>
            </div>
            <div className="absolute -top-10 -right-10 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
        </Card>
    );
}
