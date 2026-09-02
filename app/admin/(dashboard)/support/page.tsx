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
    Mail,
    X,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

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
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    metadata?: Record<string, unknown>;
}

export default function SupportCaseManagement() {
    const { email: adminEmail } = useAdmin();
    const [items, setItems] = React.useState<UniversalItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState<'all' | 'Support' | 'Message' | 'Review'>('all');

    const fetchUniversalData = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [ticketsRes, msgsRes, reviewsRes] = await Promise.all([
                supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('messages').select('*').order('created_at', { ascending: false }),
                supabase.from('reviews').select('*').order('created_at', { ascending: false })
            ]);

            const analyzeSentiment = (text: string): 'Positive' | 'Neutral' | 'Negative' => {
                const lower = text.toLowerCase();
                if (lower.includes('delay') || lower.includes('bad') || lower.includes('broken') || lower.includes('angry')) return 'Negative';
                if (lower.includes('great') || lower.includes('good') || lower.includes('awesome') || lower.includes('thanks')) return 'Positive';
                return 'Neutral';
            };

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
                    sentiment: analyzeSentiment(t.description),
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
                    created_at: m.created_at,
                    sentiment: analyzeSentiment(m.message)
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
                    sentiment: (r.rating <= 2 ? 'Negative' : r.rating >= 4 ? 'Positive' : 'Neutral') as 'Positive' | 'Neutral' | 'Negative',
                    metadata: { rating: r.rating }
                }))
            ];

            // Autonomous Prioritization: Move Negative sentiment to top if Open
            const sorted = universal.sort((a,b) => {
                if (a.status === 'Open' && b.status === 'Open') {
                    if (a.sentiment === 'Negative' && b.sentiment !== 'Negative') return -1;
                    if (b.sentiment === 'Negative' && a.sentiment !== 'Negative') return 1;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setItems(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchUniversalData();
    }, [fetchUniversalData]);

    const [activeChat, setActiveChat] = React.useState<UniversalItem | null>(null);
    const [replyText, setReplyText] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const chatRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [activeChat]);

    const handleSendReply = async () => {
        if (!activeChat || !replyText.trim()) return;
        setIsSending(true);
        try {
            const tableMap = { Support: 'support_tickets', Message: 'messages', Review: 'reviews' };
            const id = parseInt(activeChat.id.split('-')[1]);

            const { error } = await supabase!.from(tableMap[activeChat.type]).update({
                admin_response: replyText.trim(),
                status: 'Resolved'
            }).eq('id', id);

            if (error) throw error;

            await logAuditAction(adminEmail, 'LIVE_CHAT_REPLY', { id: activeChat.id });
            setItems(prev => prev.map(i => i.id === activeChat.id ? { ...i, status: 'Resolved' } : i));
            setActiveChat(null);
            setReplyText('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const filteredItems = items.filter(t => {
        const matchesQuery = (t.customer_name + t.subject + t.body).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        return matchesQuery && matchesType;
    });

    const getAISuggestion = (item: UniversalItem) => {
        if (item.type === 'Review') return "Thank you for your valuable feedback! 🚀";
        if (item.body.toLowerCase().includes('delivery')) return "Your order is currently en route. Estimated arrival in 12 mins. 🚚";
        return "I'm analyzing your request. Our support team will assist shortly. 🛡️";
    };

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
                                            {item.sentiment === 'Negative' && (
                                                <span className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[8px] font-black uppercase animate-pulse shadow-lg shadow-rose-500/20">Red Alert</span>
                                            )}
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                item.priority === 'Critical' || item.priority === 'High' ? "bg-rose-50 text-rose-600 border border-rose-100" :
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
                                    <Button
                                        onClick={() => setActiveChat(item)}
                                        className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        <MessageSquare className="h-3 w-3 mr-2" /> Live Mode
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

            {/* LIVE CHAT DRAWER */}
            {activeChat && (
                <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-[200] animate-in slide-in-from-right duration-500 border-l border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs">
                                {activeChat.customer_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-black text-foreground uppercase text-sm">{activeChat.customer_name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeChat.type} Integration</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveChat(null)} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div ref={chatRef} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-slate-50/30">
                        <div className="flex justify-start">
                            <div className="max-w-[85%] p-6 rounded-[2rem] rounded-tl-sm bg-white border border-slate-100 shadow-sm text-sm font-medium leading-relaxed italic text-slate-600">
                                &quot;{activeChat.body}&quot;
                            </div>
                        </div>

                        {activeChat.status === 'Resolved' && (
                             <div className="flex justify-end">
                                <div className="max-w-[85%] p-6 rounded-[2rem] rounded-tr-sm bg-primary text-white shadow-lg text-sm font-bold leading-relaxed">
                                    {activeChat.type === 'Review' ? 'Official response logged for customer feedback.' : 'Support Case Resolved.'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-white space-y-4">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                             <div className="flex items-center gap-3">
                                 <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                                 <p className="text-[10px] font-bold text-indigo-700 italic">AI Suggestion: &quot;{getAISuggestion(activeChat)}&quot;</p>
                             </div>
                             <button onClick={() => setReplyText(getAISuggestion(activeChat))} className="text-[8px] font-black uppercase text-indigo-600 hover:underline">Apply</button>
                        </div>
                        <div className="relative">
                            <textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Enter your response..."
                                className="w-full h-32 p-6 rounded-[2rem] bg-slate-50 border-slate-100 text-sm font-medium resize-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            />
                            <Button
                                onClick={handleSendReply}
                                disabled={!replyText.trim() || isSending}
                                className="absolute bottom-4 right-4 h-12 px-6 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3 w-3 mr-2" /> Send Reply</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
