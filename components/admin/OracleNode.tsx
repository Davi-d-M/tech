'use client';

import * as React from 'react';
import { calculateInventoryVelocity, ProductVelocity } from '@/lib/apex-os/velocity';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Zap, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function OracleNode() {
    const [predictions, setPredictions] = React.useState<ProductVelocity[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadPredictions = React.useCallback(async () => {
        setLoading(true);
        const data = await calculateInventoryVelocity();
        // Only show items with some velocity or low stock
        setPredictions(data.filter(p => p.sales_velocity > 0 || p.stock <= 5).slice(0, 4));
        setLoading(false);
    }, []);

    React.useEffect(() => {
        loadPredictions();
    }, [loadPredictions]);

    if (loading) return (
        <Card className="p-8 rounded-[3rem] border border-slate-100 bg-white animate-pulse h-[400px]">
            <div className="flex items-center gap-3 mb-8">
                <Clock className="h-5 w-5 text-slate-200" />
                <div className="h-4 w-32 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 w-full bg-slate-50 rounded-2xl" />
                ))}
            </div>
        </Card>
    );

    return (
        <Card className="p-8 rounded-[3rem] border border-slate-100 bg-white shadow-sm relative overflow-hidden group">
            <div className="relative z-10 space-y-8 text-left">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-primary animate-pulse" />
                        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground leading-none">Inventory Forecast</h2>
                    </div>
                    <span className="text-[9px] font-black uppercase text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">Sales Velocity</span>
                </div>

                <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                    &quot;Analyzing inventory throughput. Calculating projected depletion based on historical sales.&quot;
                </p>

                <div className="space-y-4">
                    {predictions.map(p => (
                        <div key={p.product_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group/item">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-[11px] font-black uppercase text-foreground truncate max-w-[150px]">{p.name}</h3>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                                    p.health_status === 'Critical' ? "bg-rose-500 text-white" :
                                    p.health_status === 'Warning' ? "bg-amber-500 text-white" :
                                    "bg-emerald-500 text-white"
                                )}>
                                    {p.health_status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase">Stock</p>
                                    <p className="text-xs font-black text-foreground">{p.stock} units</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase">Velocity</p>
                                    <p className="text-xs font-black text-primary">{p.sales_velocity}/day</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[7px] font-black text-slate-400 uppercase">Gap</p>
                                    <p className={cn(
                                        "text-xs font-black",
                                        p.days_to_depletion <= 3 ? "text-rose-600" : "text-foreground"
                                    )}>
                                        {p.days_to_depletion} Days
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {predictions.length === 0 && (
                        <p className="text-[10px] text-slate-400 font-medium italic text-center py-4">Inventory levels are stable.</p>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Inventory Pulse Active</span>
                    </div>
                    <AlertCircle size={14} className="text-slate-200" />
                </div>
            </div>
            <Clock className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 -z-0 rotate-12" />
        </Card>
    );
}
