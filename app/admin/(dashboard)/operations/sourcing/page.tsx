'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Ship,
    Plane,
    Globe,
    FileText,
    Calculator,
    TrendingUp,
    RefreshCcw,
    DollarSign,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Shipment {
    id: string;
    origin: string;
    method: 'Sea' | 'Air';
    status: 'In Transit' | 'Clearing' | 'Delivered' | 'Pending';
    eta: string;
    value_usd: number;
    description: string;
}

export default function GlobalSourcingBridge() {
    const [shipments, setShipments] = React.useState<Shipment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isCalcOpen, setIsCalcOpen] = React.useState(false);

    // Calc State
    const [usdValue, setUsdValue] = React.useState('1000');
    const [taxRate, setTaxRate] = React.useState('22.5');
    const rate = 129.5;

    const landingCost = React.useMemo(() => {
        const base = Number(usdValue) * rate;
        const tax = base * (Number(taxRate) / 100);
        return base + tax;
    }, [usdValue, taxRate]);

    const fetchShipments = React.useCallback(async () => {
        setLoading(true);
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('shipments')
                .select('*')
                .order('eta', { ascending: true });

            if (!error) setShipments(data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Global Sourcing Bridge</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Supply Chain Node</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-2">Track international imports and calculate multi-currency landing costs.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCalcOpen(true)} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                        <Calculator className="h-4 w-4 mr-2" /> Landing Calc
                    </Button>
                    <Button onClick={fetchShipments} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Log
                    </Button>
                </div>
            </header>

            {isCalcOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/10 backdrop-blur-md p-4">
                    <Card className="max-w-md w-full p-10 rounded-[3rem] bg-white border border-slate-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Landing Calculator</h3>
                            <button onClick={() => setIsCalcOpen(false)} className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors"><X size={18} /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Shipment Value (USD)</label>
                                <Input value={usdValue} onChange={e => setUsdValue(e.target.value)} type="number" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black text-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Customs / Tax Rate (%)</label>
                                <Input value={taxRate} onChange={e => setTaxRate(e.target.value)} type="number" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black text-xl" />
                            </div>
                            <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                                    <span>Calculated Landing Cost</span>
                                    <span>KES @ 129.5</span>
                                </div>
                                <p className="text-4xl font-black text-indigo-600">{formatPrice(landingCost)}</p>
                            </div>
                        </div>
                        <Button onClick={() => setIsCalcOpen(false)} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs">Close Node</Button>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {[
                    { label: 'Active Imports', val: shipments.length, icon: Ship, color: 'primary' },
                    { label: 'Clearing Pipeline', val: formatPrice(18500), icon: FileText, color: 'indigo' },
                    { label: 'Inbound Value', val: '$6,820', icon: DollarSign, color: 'emerald' },
                ].map(item => (
                    <Card key={item.label} className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all h-full">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 shadow-sm",
                            item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                            item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                            "bg-primary/5 text-primary"
                        )}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">{item.val}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Mission Inbound</h2>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">Live Freight Data</span>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                             [...Array(2)].map((_, i) => <Card key={i} className="h-32 rounded-[3rem] border border-slate-100 animate-pulse bg-white" />)
                        ) : shipments.map(ship => (
                            <Card key={ship.id} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                <div className="flex items-center gap-6 text-left">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner">
                                        {ship.method === 'Air' ? <Plane className="h-7 w-7" /> : <Ship className="h-7 w-7" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                                ship.status === 'Clearing' ? "bg-amber-500 text-white" : "bg-primary text-white"
                                            )}>{ship.status}</span>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ship.origin} &bull; ETA {ship.eta}</p>
                                        </div>
                                        <h3 className="font-black text-foreground uppercase text-lg tracking-tighter leading-none">{ship.description}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Landing Value</p>
                                    <p className="text-xl font-black text-foreground">${ship.value_usd.toLocaleString()}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8 text-left">
                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Calculator size={20} /></div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Cost Analyzer</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                                    <span>KES / USD Rate</span>
                                    <span className="text-foreground">129.50</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                                    <span>Avg Duty / Tax</span>
                                    <span className="text-rose-500">22.5%</span>
                                </div>
                                <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                    Calculate Profit Path
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-indigo-50 border border-indigo-100 space-y-6 text-left">
                         <div className="flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            <h4 className="text-lg font-black uppercase text-indigo-700 tracking-tighter">Inventory Buffer</h4>
                        </div>
                        <p className="text-[10px] text-indigo-600 font-medium leading-relaxed italic">
                            &quot;Current sea shipment (S105) contains 500+ units. I recommend pausing the &apos;Audio Pro&apos; discount once stock hits 50 units to preserve margin until clearing.&quot;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
