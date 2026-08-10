'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Users,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Target,
    Zap,
    ShieldCheck,
    Loader2,
    Trash2,
    Edit3,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Segment {
    id: string;
    name: string;
    rules: any;
    estimated_reach: number;
    created_at: string;
}

export default function AudiencesPage() {
    useAdmin();
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchSegments() {
            if (!supabase) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('customer_segments')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setSegments(data || []);
            } catch (err) {
                console.error("Segment fetch failed.");
            } finally {
                setLoading(false);
            }
        }
        fetchSegments();
    }, []);

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
                <Button className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    <Plus size={16} className="mr-2" /> Define Segment
                </Button>
            </header>

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <Card key={seg.id} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm group hover:border-primary/20 transition-all flex flex-col justify-between relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
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
                                <div className="pt-4 border-t border-border flex justify-between items-center">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Reach</p>
                                        <p className="text-2xl font-black text-primary">{seg.estimated_reach.toLocaleString()}</p>
                                    </div>
                                    <Link href="/admin/marketing/create">
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
