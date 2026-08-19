'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    MessageSquare,
    Clock,
    CheckCircle2,
    Search,
    RefreshCcw,
    Send,
    Loader2,
    ShieldAlert,
    Tag,
    AlertCircle,
    Star,
    Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface SupportTicket {
    id: number;
    customer_name: string;
    customer_email: string;
    subject: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    category: string;
    status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
    assigned_to?: string;
    created_at: string;
    sla_hours: number;
}

interface StaffMember {
    id: string;
    email: string;
}

interface UniversalItem {
    id: string;
    type: 'Support' | 'Message' | 'Review';
    customer_name: string;
    customer_email: string;
    subject: string;
    body: string;
    priority: string;
    status: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}

export default function SupportCaseManagement() {
    const { email: adminEmail } = useAdmin();
    const [items, setItems] = React.useState<UniversalItem[]>([]);
    const [staff, setStaff] = React.useState<StaffMember[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [typeFilter, setTypeFilter] = React.useState<'all' | 'Support' | 'Message' | 'Review'>('all');

    const fetchUniversalData = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [ticketsRes, msgsRes, reviewsRes, staffRes] = await Promise.all([
                supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('messages').select('*').order('created_at', { ascending: false }),
                supabase.from('reviews').select('*').order('created_at', { ascending: false }),
                supabase.from('staff').select('id, email')
            ]);

            const universal: UniversalItem[] = [
                ...(ticketsRes.data || []).map(t => ({
                    id: `sup-${t.id}`,
                    type: 'Support' as const,
                    customer_name: t.customer_name,
                    customer_email: t.customer_email,
                    subject: t.subject,
                    body: t.description,
                    priority: t.priority,
                    status: t.status,
                    created_at: t.created_at,
                    metadata: { sla: t.sla_hours, assigned_to: t.assigned_to }
                })),
                ...(msgsRes.data || []).map(m => ({
                    id: `msg-${m.id}`,
                    type: 'Message' as const,
                    customer_name: m.name,
                    customer_email: m.email,
                    subject: m.subject,
                    body: m.message,
                    priority: 'Medium',
                    status: m.status === 'New' ? 'Open' : m.status === 'Replied' ? 'Resolved' : 'InProgress',
                    created_at: m.created_at
                })),
                ...(reviewsRes.data || []).map(r => ({
                    id: `rev-${r.id}`,
                    type: 'Review' as const,
                    customer_name: r.customer_name,
                    customer_email: 'review@system',
                    subject: `${r.rating} Star Review`,
                    body: r.comment,
                    priority: r.rating <= 2 ? 'High' : 'Low',
                    status: r.admin_response ? 'Resolved' : 'Open',
                    created_at: r.created_at,
                    metadata: { rating: r.rating }
                }))
            ];

            setItems(universal.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setStaff(staffRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchUniversalData();
    }, [fetchUniversalData]);

    const filteredItems = items.filter(t => {
        const matchesQuery = (t.customer_name + t.subject + t.body).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        return matchesQuery && matchesStatus && matchesType;
    });

    const updateItemStatus = async (item: UniversalItem, newStatus: string) => {
        if (!supabase) return;
        const tableMap = { Support: 'support_tickets', Message: 'messages', Review: 'reviews' };
        const id = parseInt(item.id.split('-')[1]);

        let updatePayload: Record<string, unknown> = { status: newStatus };
        if (item.type === 'Review') updatePayload = { admin_response: 'Internal status change' };

        const { error } = await supabase.from(tableMap[item.type]).update(updatePayload).eq('id', id);
        if (!error) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
            await logAuditAction(adminEmail, 'UNIVERSAL_STATUS_CHANGE', { id: item.id, status: newStatus });
        }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Unified Inbox Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Universal Command</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Cross-channel customer intelligence and prioritized response grid.</p>
                </div>
                <Button onClick={fetchUniversalData} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Matrix
                </Button>
            </header>

            {/* Support KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Comms', val: items.length, icon: MessageSquare, color: 'primary' },
                    { label: 'Untreated', val: items.filter(i => i.status === 'Open').length, icon: Clock, color: 'amber' },
                    { label: 'High Priority', val: items.filter(i => i.priority === 'High' || i.priority === 'Critical').length, icon: ShieldAlert, color: 'rose' },
                    { label: 'Verified Meta', val: items.filter(i => i.type === 'Review').length, icon: Star, color: 'indigo' },
                ].map(item => (
                    <Card key={item.label} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm",
                            item.color === 'rose' ? "bg-rose-50 text-rose-500" :
                            item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                            item.color === 'primary' ? "bg-primary/5 text-primary" :
                            "bg-indigo-50 text-indigo-500"
                        )}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search Identity, Subject or Content..."
                        className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {(['all', 'Support', 'Message', 'Review'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setTypeFilter(f)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                typeFilter === f ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-foreground"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-32 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Accessing Support Matrix...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredItems.map(item => (
                        <Card key={item.id} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden text-left">
                            <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                                <div className="space-y-6 flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-xs uppercase shadow-inner",
                                            item.type === 'Support' ? "bg-primary" : item.type === 'Message' ? "bg-emerald-500" : "bg-amber-500"
                                        )}>
                                            {item.type === 'Support' ? <AlertCircle size={20} /> : item.type === 'Message' ? <Mail size={20} /> : <Star size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-foreground uppercase text-sm tracking-tight">{item.customer_name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.customer_email}</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-3">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                item.priority === 'Critical' || item.priority === 'High' ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" :
                                                "bg-slate-100 text-slate-500"
                                            )}>
                                                {item.priority} Priority
                                            </span>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                item.status === 'Open' ? "bg-primary/10 text-primary border-primary/20" :
                                                item.status === 'InProgress' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pl-16 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Tag size={12} className="text-primary" />
                                            <span className="text-[9px] font-black uppercase text-primary tracking-widest">{item.type} Channel</span>
                                        </div>
                                        <h4 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">{item.subject}</h4>
                                        <p className="text-slate-600 font-medium leading-relaxed italic max-w-4xl">&quot;{item.body}&quot;</p>

                                        <div className="pt-6 flex items-center gap-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                            <div className="flex items-center gap-2"><Clock size={12} /> Established {new Date(item.created_at).toLocaleString()}</div>
                                            {item.metadata?.sla ? <div className="flex items-center gap-2 text-rose-400"><AlertCircle size={12} /> SLA: {String(item.metadata.sla)}h Remaining</div> : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-64 flex flex-col gap-3 justify-center">
                                    <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                                        <Send className="h-3 w-3 mr-2" /> Quick Reply
                                    </Button>
                                    <Button
                                        onClick={() => updateItemStatus(item, 'Resolved')}
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-2" /> Mark Resolved
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
