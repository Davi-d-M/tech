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
    ChevronRight,
    Tag,
    AlertCircle
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

export default function SupportCaseManagement() {
    const { email: adminEmail } = useAdmin();
    const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
    const [staff, setStaff] = React.useState<StaffMember[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');

    const fetchSupportData = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [ticketsRes, staffRes] = await Promise.all([
                supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('staff').select('id, email')
            ]);

            setTickets(ticketsRes.data || []);
            setStaff(staffRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchSupportData();
    }, [fetchSupportData]);

    const stats = React.useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open').length,
        critical: tickets.filter(t => t.priority === 'Critical').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length
    }), [tickets]);

    const filteredTickets = tickets.filter(t => {
        const matchesQuery = (t.customer_name + t.subject).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    const updateTicketStatus = async (id: number, status: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
        if (!error) {
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
            await logAuditAction(adminEmail, 'SUPPORT_TICKET_STATUS_CHANGE', { id, status });
        }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Support OS Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Case Command</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">SLA-driven customer resolution and ticket orchestration.</p>
                </div>
                <Button onClick={fetchSupportData} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Matrix
                </Button>
            </header>

            {/* Support KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Live Tickets', val: stats.total, icon: MessageSquare, color: 'primary' },
                    { label: 'Untreated (Open)', val: stats.open, icon: Clock, color: 'amber' },
                    { label: 'Critical Ops', val: stats.critical, icon: ShieldAlert, color: 'rose' },
                    { label: 'Resolved', val: stats.resolved, icon: CheckCircle2, color: 'emerald' },
                ].map(item => (
                    <Card key={item.label} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm",
                            item.color === 'rose' ? "bg-rose-50 text-rose-500" :
                            item.color === 'amber' ? "bg-amber-50 text-amber-500" :
                            item.color === 'primary' ? "bg-primary/5 text-primary" :
                            "bg-emerald-50 text-emerald-600"
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
                        placeholder="Search Identity, Subject or Ticket ID..."
                        className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100">
                    {['all', 'Open', 'InProgress', 'Resolved'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                statusFilter === f ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-foreground"
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
                    {filteredTickets.map(t => (
                        <Card key={t.id} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                                <div className="space-y-6 flex-1 text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase shadow-inner">
                                            {t.customer_name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-foreground uppercase text-sm tracking-tight">{t.customer_name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{t.customer_email}</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-3">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                t.priority === 'Critical' ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" :
                                                t.priority === 'High' ? "bg-amber-50 text-amber-600" :
                                                "bg-slate-100 text-slate-500"
                                            )}>
                                                {t.priority} Priority
                                            </span>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                t.status === 'Open' ? "bg-primary/10 text-primary border-primary/20" :
                                                t.status === 'InProgress' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}>
                                                {t.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pl-16 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Tag size={12} className="text-primary" />
                                            <span className="text-[9px] font-black uppercase text-primary tracking-widest">{t.category}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">{t.subject}</h4>
                                        <p className="text-slate-600 font-medium leading-relaxed italic max-w-4xl">&quot;{t.description}&quot;</p>

                                        <div className="pt-6 flex items-center gap-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                            <div className="flex items-center gap-2"><Clock size={12} /> Established {new Date(t.created_at).toLocaleString()}</div>
                                            <div className="flex items-center gap-2 text-rose-400"><AlertCircle size={12} /> SLA: {t.sla_hours}h Remaining</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-64 flex flex-col gap-3">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black uppercase text-slate-400 ml-1">Assigned Agent</p>
                                        <select
                                            className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={t.assigned_to || ''}
                                            onChange={e => {}}
                                        >
                                            <option value="">Unassigned</option>
                                            {staff.map(s => <option key={s.id} value={s.id}>{s.email.split('@')[0]}</option>)}
                                        </select>
                                    </div>
                                    <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                                        <Send className="h-3 w-3 mr-2" /> Open Comms
                                    </Button>
                                    <Button
                                        onClick={() => updateTicketStatus(t.id, 'Resolved')}
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-2" /> Resolve Case
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
