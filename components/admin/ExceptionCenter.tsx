'use client';

import * as React from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    Zap,
    Truck,
    Package,
    CreditCard,
    ChevronRight,
    Loader2,
    Shield,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { scanForExceptions, ApexException } from '@/lib/apex-os/intelligence';

export default function ExceptionCenter() {
    const [exceptions, setExceptions] = React.useState<ApexException[]>([]);
    const [loading, setLoading] = React.useState(true);

    const runScan = React.useCallback(async () => {
        const results = await scanForExceptions();
        setExceptions(results);
        setLoading(false);
    }, []);

    React.useEffect(() => {
        runScan();
        const interval = setInterval(runScan, 60000);
        return () => clearInterval(interval);
    }, [runScan]);

    if (loading && exceptions.length === 0) return (
        <div className="p-20 text-center animate-pulse opacity-30">
            <Loader2 className="h-8 w-8 mx-auto animate-spin" />
            <p className="text-[10px] font-black uppercase mt-4">Scanning Operations...</p>
        </div>
    );

    if (exceptions.length === 0) return (
        <section className="bg-white rounded-[3rem] border border-slate-100 p-12 text-center relative overflow-hidden group">
            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none">Link Status: Secure</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Apex OS detecting zero operational anomalies.</p>
                </div>
            </div>
            <ShieldCheck className="absolute -bottom-10 -right-10 h-64 w-64 text-emerald-500/5 rotate-12 -z-0" />
        </section>
    );

    const iconMap = {
        LOGISTICS: Truck,
        INVENTORY: Package,
        FINANCE: CreditCard,
        RISK: Shield,
        SUPPLIER: Zap
    };

    return (
        <section className="bg-white rounded-[3rem] border border-rose-100 p-10 relative overflow-hidden shadow-sm animate-in fade-in duration-1000">
            <div className="relative z-10 space-y-10 text-left">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm animate-pulse border border-rose-100">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Exception Center</h2>
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">Anomaly Detection Protocol Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={runScan} className="h-10 px-4 rounded-xl border border-border text-[9px] font-black uppercase hover:bg-slate-50 transition-all">Re-Scan</button>
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
                            {exceptions.length} Critial Alerts
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exceptions.map(ex => {
                        const Icon = iconMap[ex.type] || Zap;
                        return (
                            <Link key={ex.id} href={ex.order_id ? `/admin/orders` : '#'}>
                                <div className={cn(
                                    "p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl relative group",
                                    ex.severity === 'Critical' ? "bg-rose-50/50 border-rose-100 hover:bg-white hover:border-rose-300" : "bg-slate-50 border-border hover:bg-white hover:border-primary/20"
                                )}>
                                    {ex.severity === 'Critical' && <div className="absolute top-0 left-0 h-full w-2 bg-rose-500 rounded-l-[2.5rem]"></div>}

                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm",
                                                ex.severity === 'Critical' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                                            )}>
                                                <Icon className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={cn(
                                                        "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                                        ex.severity === 'Critical' ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                                                    )}>{ex.severity}</span>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ex.type} &bull; {ex.time}</p>
                                                </div>
                                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{ex.title}</h4>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed italic">&quot;{ex.description}&quot;</p>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-4">
                                            <ChevronRight className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="absolute -bottom-10 -right-10 h-64 w-64 text-rose-500/5 rotate-12 -z-0">
                <AlertTriangle size={256} />
            </div>
        </section>
    );
}
