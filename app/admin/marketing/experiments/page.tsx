'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    CheckCircle2,
    Target,
    Activity,
    Trophy,
    AlertCircle,
    Zap,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Experiment {
    id: string;
    name: string;
    status: 'Running' | 'Paused' | 'Ended';
    variant_a: { name: string, orders: number, ctr: number };
    variant_b: { name: string, orders: number, ctr: number };
    winning_variant?: 'A' | 'B';
    created_at: string;
}

export default function ExperimentationCenter() {
    useAdmin();
    const [experiments, setExperiments] = React.useState<Experiment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isAdding, setIsAdding] = React.useState(false);
    const [newExp, setNewExp] = React.useState({ name: '', varA: '', varB: '' });

    const fetchExperiments = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('marketing_experiments').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setExperiments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchExperiments();
    }, [fetchExperiments]);

    const adoptVariant = async (id: string, variant: 'A' | 'B') => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('marketing_experiments').update({
                status: 'Ended',
                winning_variant: variant
            }).eq('id', id);

            if (error) throw error;

            setMessage({ type: 'success', text: `Protocol updated. Version ${variant} is now the global default. 🚀` });
            setTimeout(() => setMessage(null), 5000);
            setExperiments(prev => prev.map(e => e.id === id ? { ...e, status: 'Ended', winning_variant: variant } : e));
        } catch (err) {
            console.error(err);
        }
    };

    const startExperiment = () => {
        setIsAdding(true);
    };

    const handleCreateExperiment = async () => {
        if (!supabase || !newExp.name.trim()) return;
        try {
            const { error } = await supabase.from('marketing_experiments').insert([{
                name: newExp.name,
                status: 'Running',
                variant_a: { name: newExp.varA || 'Variant A', orders: 0, ctr: 0 },
                variant_b: { name: newExp.varB || 'Variant B', orders: 0, ctr: 0 }
            }]);

            if (error) throw error;

            setMessage({ type: 'success', text: "New yield experiment initialized. 🧪" });
            setTimeout(() => setMessage(null), 3000);
            setIsAdding(false);
            setNewExp({ name: '', varA: '', varB: '' });
            fetchExperiments();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Yield Lab</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Experimentation</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-2">Optimize conversion funnels through clinical A/B testing protocols.</p>
                </div>
                <Button onClick={startExperiment} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    <Plus size={16} className="mr-2" /> Start Experiment
                </Button>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="p-40 text-center flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Warming Lab Sensors...</p>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-12 gap-10 items-stretch p-10 bg-white">
                        <div className="lg:col-span-8 space-y-8 h-full flex flex-col">
                            {experiments.length === 0 ? (
                                <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] opacity-30">
                                    <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-sm font-black uppercase tracking-widest">No Active Experiments</p>
                                </div>
                            ) : (
                                experiments.map(exp => {
                                    const winner = exp.variant_a.ctr > exp.variant_b.ctr ? 'A' : 'B';
                                    return (
                                        <Card key={exp.id} className="p-10 rounded-[3.5rem] border border-slate-100 bg-white shadow-sm space-y-10 flex-1 flex flex-col justify-between group hover:shadow-xl transition-all">
                                            <div>
                                                <div className="flex justify-between items-center mb-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-sm"><Target size={24} /></div>
                                                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">{exp.name}</h3>
                                                    </div>
                                                    <span className={cn(
                                                        "px-4 py-2 text-[10px] font-black uppercase rounded-full tracking-widest border",
                                                        exp.status === 'Running' ? "bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse" : "bg-slate-50 text-slate-400 border-slate-100"
                                                    )}>{exp.status}</span>
                                                </div>

                                                <div className="grid sm:grid-cols-2 gap-10 items-stretch">
                                                    <div className={cn(
                                                        "p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden h-full flex flex-col justify-between",
                                                        (exp.winning_variant === 'A' || (winner === 'A' && exp.status !== 'Ended')) ? "border-emerald-500/20 bg-emerald-50/10" : "border-slate-100 bg-slate-50/50"
                                                    )}>
                                                        {exp.winning_variant === 'A' && <div className="absolute top-4 right-4"><CheckCircle2 className="text-emerald-500 h-6 w-6" /></div>}
                                                        <div className="relative z-10 space-y-6">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Version A</p>
                                                            <h4 className="text-xl font-black text-foreground uppercase italic leading-none">{exp.variant_a.name}</h4>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[8px] font-black uppercase text-slate-400">CTR</p>
                                                                    <p className="text-2xl font-black text-foreground">{exp.variant_a.ctr}%</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] font-black uppercase text-slate-400">Orders</p>
                                                                    <p className="text-2xl font-black text-foreground">{exp.variant_a.orders}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden h-full flex flex-col justify-between",
                                                        (exp.winning_variant === 'B' || (winner === 'B' && exp.status !== 'Ended')) ? "border-emerald-500 border-emerald-50/30 shadow-2xl" : "border-slate-100 bg-slate-50/50"
                                                    )}>
                                                        {(exp.winning_variant === 'B' || (winner === 'B' && exp.status !== 'Ended')) && <div className="absolute top-4 right-4"><Trophy className="text-primary h-6 w-6" /></div>}
                                                        <div className="relative z-10 space-y-6">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Version B</p>
                                                            <h4 className="text-xl font-black text-foreground uppercase italic leading-none">{exp.variant_b.name}</h4>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[8px] font-black uppercase text-slate-400">CTR</p>
                                                                    <p className="text-2xl font-black text-primary">{exp.variant_b.ctr}%</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] font-black uppercase text-slate-400">Orders</p>
                                                                    <p className="text-2xl font-black text-primary">{exp.variant_b.orders}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                                                <p className="text-[10px] text-slate-400 font-medium italic">
                                                    {exp.status === 'Ended' ? "Experiment concluded." : "\"Statistical significance reached in favor of Version B yield.\""}
                                                </p>
                                                <Button onClick={() => adoptVariant(exp.id, 'B')} disabled={exp.status === 'Ended'} className="rounded-xl h-12 px-8 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg">Adopt Version B</Button>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-10 h-full">
                            <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden group flex-1 flex flex-col justify-between">
                                <div className="relative z-10 space-y-10 text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Zap size={24} className="fill-current" /></div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Conversion Funnel</h3>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <span>Product Views</span>
                                                <span className="text-foreground">9.8K</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div className="h-full bg-primary w-full"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <span>Cart Additions</span>
                                                <span className="text-foreground">2.1K</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div className="h-full bg-primary w-[22%]"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <span>Checkout Start</span>
                                                <span className="text-foreground">1.0K</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div className="h-full bg-primary w-[11%]"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <span>Completed Order</span>
                                                <span className="text-emerald-500">684</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div className="h-full bg-emerald-500 w-[7%]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="p-8 rounded-[3rem] bg-white border border-border shadow-sm space-y-4 text-left">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Zap size={18} /></div>
                                <h4 className="text-lg font-black uppercase text-foreground leading-none">Yield Booster</h4>
                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                    &quot;Current leakage detected in the Cart-to-Checkout transition. Version B pricing anchor is recommended.&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/20 backdrop-blur-md p-6">
                    <Card className="max-w-md w-full bg-card rounded-[3rem] border border-border shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Zap size={24} /></div>
                            <h3 className="text-2xl font-black uppercase text-foreground tracking-tighter">New Yield Test</h3>
                        </div>
                        <div className="space-y-4 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Experiment Name</label>
                                <Input value={newExp.name} onChange={e => setNewExp({...newExp, name: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground" placeholder="e.g. Price Anchor Test" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Variant A</label>
                                    <Input value={newExp.varA} onChange={e => setNewExp({...newExp, varA: e.target.value})} className="h-12 rounded-xl bg-secondary border-border font-bold text-foreground" placeholder="Baseline" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Variant B</label>
                                    <Input value={newExp.varB} onChange={e => setNewExp({...newExp, varB: e.target.value})} className="h-12 rounded-xl bg-secondary border-border font-bold text-foreground" placeholder="Challenger" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button onClick={handleCreateExperiment} className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Launch Lab</Button>
                            <Button onClick={() => setIsAdding(false)} variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] border-border">Abort</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
