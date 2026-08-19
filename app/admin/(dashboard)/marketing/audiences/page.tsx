'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Target,
    Zap,
    ArrowRight,
    Loader2,
    X,
    Filter,
    Activity,
    DollarSign,
    ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';

interface Segment {
    id: string;
    name: string;
    rules: Record<string, unknown>;
    estimated_reach: number;
    created_at: string;
}

export default function AudiencesPage() {
    useAdmin();
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDefining, setIsDefining] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    // Define State
    const [newSegment, setNewSegment] = useState({
        name: '',
        spend_min: '0',
        orders_min: '0',
        last_order_days: '90',
        reach: 0
    });

    const calculateReach = async () => {
        if (!supabase) return;
        setIsCalculating(true);
        try {
            // Simulated rule-based calculation on the server/DB
            await new Promise(r => setTimeout(r, 1500));
            const baseReach = Math.floor(Math.random() * 500) + 50;
            setNewSegment(prev => ({ ...prev, reach: baseReach }));
        } finally {
            setIsCalculating(false);
        }
    };

    const handleCreateSegment = async () => {
        if (!supabase || !newSegment.name) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('customer_segments').insert([{
                name: newSegment.name,
                estimated_reach: newSegment.reach,
                rules: {
                    spend_min: Number(newSegment.spend_min),
                    orders_min: Number(newSegment.orders_min),
                    last_order_days: Number(newSegment.last_order_days)
                }
            }]);
            if (error) throw error;
            setIsDefining(false);
            setNewSegment({ name: '', spend_min: '0', orders_min: '0', last_order_days: '90', reach: 0 });
            // Refresh list
            const { data } = await supabase.from('customer_segments').select('*').order('created_at', { ascending: false });
            setSegments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = segments.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Audience Intel</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Customer Segments</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Manage dynamic targeting rules and audience clusters.</p>
                </div>
                <Button
                    onClick={() => setIsDefining(true)}
                    className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={16} className="mr-2" /> Define Segment
                </Button>
            </header>

            {isDefining && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/20 backdrop-blur-md p-6">
                    <Card className="max-w-2xl w-full bg-white rounded-[3.5rem] border border-border shadow-2xl p-10 space-y-10 animate-in zoom-in-95 duration-500 text-left">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Filter size={24} /></div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Rule Engine</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dynamic Audience Builder</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDefining(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Segment Identity</label>
                                <Input
                                    value={newSegment.name}
                                    onChange={e => setNewSegment({...newSegment, name: e.target.value})}
                                    placeholder="e.g. High-Spending Lapsed VIPs"
                                    className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-2 px-1"><DollarSign size={10} /> Minimum Spend (LTV)</label>
                                        <Input type="number" value={newSegment.spend_min} onChange={e => setNewSegment({...newSegment, spend_min: e.target.value})} className="h-12 rounded-xl bg-secondary border-border font-black text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-2 px-1"><ShoppingCart size={10} /> Min Orders</label>
                                        <Input type="number" value={newSegment.orders_min} onChange={e => setNewSegment({...newSegment, orders_min: e.target.value})} className="h-12 rounded-xl bg-secondary border-border font-black text-foreground" />
                                    </div>
                                </div>

                                <div className="p-8 rounded-[2.5rem] bg-secondary border border-border flex flex-col justify-center text-center space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estimated Reach</p>
                                        <h4 className="text-5xl font-black text-primary tracking-tighter tabular-nums">
                                            {isCalculating ? '---' : newSegment.reach.toLocaleString()}
                                        </h4>
                                    </div>
                                    <Button
                                        onClick={calculateReach}
                                        disabled={isCalculating}
                                        variant="outline"
                                        className="h-10 rounded-xl bg-white text-[8px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50"
                                    >
                                        {isCalculating ? <Loader2 size={12} className="animate-spin mr-2" /> : <Activity size={12} className="mr-2" />}
                                        Run Reach Scan
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-border">
                            <Button
                                onClick={handleCreateSegment}
                                disabled={!newSegment.name || loading}
                                className="flex-1 h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : "Commit Segment"}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by segment name..."
                        className="h-14 rounded-2xl bg-card border-border pl-12 text-sm font-bold shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <Card key={i} className="p-8 rounded-[2.5rem] bg-card border-border animate-pulse h-64"></Card>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-40 text-center space-y-6 opacity-30">
                        <Target size={64} className="mx-auto" />
                        <p className="text-lg font-black uppercase tracking-tighter">No Segments Defined</p>
                    </div>
                ) : (
                    filtered.map((seg) => (
                        <Card key={seg.id} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm group hover:border-primary/20 transition-all flex flex-col justify-between relative overflow-hidden h-full">
                            <div className="relative z-10 space-y-6 flex flex-col h-full justify-between">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Target size={24} />
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                            <MoreVertical size={16} className="text-muted-foreground" />
                                        </Button>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{seg.name}</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rule-Based Dynamic List</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border flex justify-between items-center mt-auto">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Reach</p>
                                        <p className="text-2xl font-black text-primary">{seg.estimated_reach.toLocaleString()}</p>
                                    </div>
                                    <Link href="/admin/marketing/create" className="flex">
                                        <Button size="sm" variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                                            Target <ArrowRight size={12} className="ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <Zap className="absolute -bottom-10 -right-10 h-32 w-32 text-primary/5 rotate-12 -z-0" />
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
