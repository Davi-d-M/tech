'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Zap,
    RefreshCcw,
    Plus,
    Activity,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Supplier {
    id: number;
    name: string;
    email: string;
    rating: number;
    fill_rate: number;
    on_time_dispatch_rate: number;
    defect_rate: number;
    status: 'Active' | 'UnderReview' | 'Suspended';
}

export default function SupplierScorecards() {
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchSuppliers = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('suppliers').select('*');
            if (error) throw error;
            setSuppliers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Procurement Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Supplier Scorecards</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Algorithmically ranked supplier performance monitoring.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchSuppliers} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Performance
                    </Button>
                    <Button className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="h-4 w-4 mr-2" /> New Supplier
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {suppliers.map(s => (
                    <Card key={s.id} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground font-black text-xl">
                                        {s.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">{s.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{s.email}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                    s.rating >= 90 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    s.rating >= 70 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                    "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                                )}>
                                    {s.rating} Score
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>Fill Rate</span>
                                        <span>{s.fill_rate}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.fill_rate}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>On-Time Dispatch</span>
                                        <span>{s.on_time_dispatch_rate}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${s.on_time_dispatch_rate}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>Defect Rate</span>
                                        <span className={cn(s.defect_rate > 3 ? "text-rose-500" : "text-emerald-500")}>{s.defect_rate}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${s.defect_rate}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{s.rating >= 90 ? 'Platinum Tier' : 'Standard'}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-primary tracking-widest">Analytics &rarr;</Button>
                            </div>
                        </div>
                        <Target className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 -rotate-12" />
                    </Card>
                ))}

                {suppliers.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-card rounded-[3rem] border-2 border-dashed border-border opacity-30">
                        <Zap className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                        <p className="text-sm font-black text-slate-400 uppercase italic">Awaiting Supplier Integration Data.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
