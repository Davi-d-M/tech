'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    History,
    Search,
    Filter,
    ChevronRight,
    Activity as Zap,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Plus,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface Campaign {
    id: string;
    name: string;
    type: string;
    status: string;
    product_id: number;
    scheduled_at: string | null;
    published_at: string | null;
    created_at: string;
    products?: { name: string };
}

export default function CampaignHistory() {
    const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');

    React.useEffect(() => {
        async function fetchCampaigns() {
            if (!supabase) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('marketing_campaigns')
                    .select('*, products(name)')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setCampaigns(data || []);
            } catch (err) {
                console.error("Campaign fetch failed.");
            } finally {
                setLoading(false);
            }
        }
        fetchCampaigns();
    }, []);

    const filtered = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <History className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Deployment Log</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Campaign History</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Review past tactical missions and monitor scheduled launches.</p>
                </div>
                <Link href="/admin/marketing/create">
                    <Button className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={16} className="mr-2" /> New Campaign
                    </Button>
                </Link>
            </header>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by mission name or type..."
                        className="h-14 rounded-2xl bg-card border-border pl-12 text-sm font-bold shadow-sm"
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl border-border bg-card font-black uppercase text-[10px] tracking-widest">
                    <Filter size={16} className="mr-2" /> Filter Status
                </Button>
            </div>

            <div className="bg-card rounded-[3rem] border border-border shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="p-40 text-center flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-[10px] font-black uppercase text-muted tracking-widest">Decrypting Logs...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-40 text-center space-y-6 opacity-30">
                        <Zap size={64} className="mx-auto" />
                        <p className="text-lg font-black uppercase tracking-tighter">No Campaigns Dispatched</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em]">
                                    <th className="px-10 py-6">Mission Details</th>
                                    <th className="px-10 py-6">Target Payload</th>
                                    <th className="px-10 py-6">Status</th>
                                    <th className="px-10 py-6">Scheduled</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((camp) => (
                                    <tr key={camp.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-10 py-8">
                                            <div>
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">{camp.name}</p>
                                                <p className="text-[9px] font-bold text-primary uppercase mt-1">{camp.type}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                    <Zap size={14} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-slate-500">{camp.products?.name || 'Multi-Payload'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                camp.status === 'Published' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                camp.status === 'Scheduled' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                "bg-slate-50 text-slate-500 border-slate-200"
                                            )}>
                                                {camp.status === 'Published' ? <CheckCircle2 size={12} /> :
                                                 camp.status === 'Scheduled' ? <Clock size={12} /> :
                                                 <AlertCircle size={12} />}
                                                {camp.status}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-[10px] font-bold text-foreground uppercase">{camp.scheduled_at ? new Date(camp.scheduled_at).toLocaleDateString() : 'Instant'}</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mt-1">{camp.scheduled_at ? new Date(camp.scheduled_at).toLocaleTimeString() : '---'}</p>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
                                                    <ChevronRight size={18} className="text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
                                                    <MoreVertical size={18} className="text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
