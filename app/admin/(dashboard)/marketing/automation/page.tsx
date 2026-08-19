'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Rocket,
    Plus,
    Zap,
    Users,
    MessageCircle,
    Mail,
    Loader2,
    CheckCircle2,
    ShieldAlert,
    Activity,
    TrendingUp,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface AutomationRule {
    id: string;
    name: string;
    trigger: string;
    action: string;
    channel: 'WhatsApp' | 'Email' | 'System';
    is_active: boolean;
    runs_count: number;
    last_run_at: string | null;
}

export default function MarketingAutopilot() {
    const { email } = useAdmin();
    const [rules, setRules] = React.useState<AutomationRule[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isAdding, setIsAdding] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [newRule, setNewRule] = React.useState<{
        name: string;
        trigger: string;
        channel: 'WhatsApp' | 'Email' | 'System';
        action: string;
    }>({
        name: '',
        trigger: 'On Signup',
        channel: 'Email',
        action: 'Send Welcome Coupon'
    });

    const fetchRules = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('marketing_automations').select('*').order('created_at', { ascending: false });
            setRules(data || [
                { id: '1', name: 'Welcome Protocol', trigger: 'On Signup', action: 'Send 10% Coupon', channel: 'Email', is_active: true, runs_count: 842, last_run_at: new Date().toISOString() },
                { id: '2', name: 'Retention Loop', trigger: '30 Days Inactive', action: 'Send Re-engagement Deal', channel: 'WhatsApp', is_active: true, runs_count: 124, last_run_at: new Date().toISOString() },
                { id: '3', name: 'Review Booster', trigger: '3 Days Post-Delivery', action: 'Request Review', channel: 'System', is_active: false, runs_count: 0, last_run_at: null }
            ]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const toggleRule = async (id: string, current: boolean) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('marketing_automations').update({ is_active: !current }).eq('id', id);
            if (!error) {
                setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r));
                await logAuditAction(email, 'TOGGLE_AUTOMATION', { id, state: !current });
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateRule = async () => {
        if (!supabase || !newRule.name.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('marketing_automations').insert([{
                ...newRule,
                is_active: true,
                runs_count: 0
            }]);
            if (error) throw error;
            setIsAdding(false);
            setNewRule({ name: '', trigger: 'On Signup', channel: 'Email', action: 'Send Welcome Coupon' });
            fetchRules();
            setMessage({ type: 'success', text: "Automation protocol engaged. 🤖" });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Rocket className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Autopilot Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Journey Builder</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Automated engagement loops and self-scaling growth protocols.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    <Plus size={16} className="mr-2" /> New Automation
                </Button>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
                    <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Active Protocols</h2>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{rules.length} Loops</span>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-[3rem] border border-slate-100">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-[10px] font-black uppercase text-slate-300">Syncing Journey Nodes...</p>
                            </div>
                        ) : rules.map(rule => (
                            <Card key={rule.id} className={cn(
                                "p-8 rounded-[3rem] border transition-all hover:shadow-xl relative overflow-hidden group",
                                rule.is_active ? "bg-white border-slate-100" : "bg-slate-50/50 border-dashed border-slate-200 opacity-60"
                            )}>
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
                                    <div className="flex items-center gap-6 flex-1 text-left">
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                                            rule.channel === 'WhatsApp' ? "bg-emerald-50 text-emerald-500" :
                                            rule.channel === 'Email' ? "bg-indigo-50 text-indigo-500" :
                                            "bg-primary/5 text-primary"
                                        )}>
                                            {rule.channel === 'WhatsApp' ? <MessageCircle size={24} /> :
                                             rule.channel === 'Email' ? <Mail size={24} /> : <Zap size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{rule.trigger}</span>
                                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                <span className="text-[8px] font-black uppercase text-slate-400">{rule.channel}</span>
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{rule.name}</h3>
                                            <p className="text-[10px] font-medium italic text-slate-500 mt-1">&quot;{rule.action}&quot;</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Total Conversions</p>
                                            <p className="text-2xl font-black text-foreground tabular-nums">{rule.runs_count.toLocaleString()}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => toggleRule(rule.id, rule.is_active)}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all relative p-1 flex items-center shadow-inner",
                                                    rule.is_active ? "bg-emerald-500" : "bg-slate-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                                                    rule.is_active ? "translate-x-6" : "translate-x-0"
                                                )} />
                                            </button>
                                            <button className="text-[8px] font-black uppercase text-rose-400 hover:text-rose-600 transition-colors">Expel Node</button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden group text-left">
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform"><Activity size={20} /></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Autopilot Yield</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Automated Revenue (30d)</p>
                                    <p className="text-4xl font-black text-foreground tracking-tighter">KSh 42,400</p>
                                    <div className="flex items-center gap-2 mt-2 text-emerald-500">
                                        <TrendingUp size={12} />
                                        <span className="text-[10px] font-black uppercase">+18.4% Efficiency Boost</span>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-50 space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                                        <span>Retention Index</span>
                                        <span className="text-foreground">84%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div className="h-full bg-primary" style={{ width: '84%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Zap className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12 -z-0" />
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-4 text-left">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><Users size={18} /></div>
                        <h4 className="text-lg font-black uppercase text-foreground leading-none">Customer Cycle</h4>
                        <p className="text-[10px] text-muted-foreground font-medium italic">
                            &quot;Current loops are saving 14 hours of manual outreach weekly. I recommend activating the &apos;VIP Tier-Up&apos; loop to boost LTV.&quot;
                        </p>
                    </div>
                </div>
            </div>

            {/* MODAL: NEW RULE */}
            {isAdding && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/20 backdrop-blur-md p-6">
                    <Card className="max-w-xl w-full bg-white rounded-[3.5rem] border border-border shadow-2xl p-10 space-y-10 animate-in zoom-in-95 duration-500 text-left">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4 text-left">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Plus size={24} /></div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Engage Autopilot</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Establish Automation Node</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={24} /></button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mission Name</label>
                                <Input
                                    value={newRule.name}
                                    onChange={e => setNewRule({...newRule, name: e.target.value})}
                                    className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground"
                                    placeholder="e.g. Lapsed VIP Recovery"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Event Trigger</label>
                                    <select
                                        value={newRule.trigger}
                                        onChange={e => setNewRule({...newRule, trigger: e.target.value})}
                                        className="w-full h-14 rounded-2xl bg-secondary border border-border px-4 text-[10px] font-black uppercase text-foreground outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option>On Signup</option>
                                        <option>After Purchase</option>
                                        <option>On Stock Alert</option>
                                        <option>30 Days Inactive</option>
                                        <option>3 Days Post-Delivery</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Dispatch Channel</label>
                                    <div className="flex gap-2">
                                        {(['Email', 'WhatsApp', 'System'] as const).map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setNewRule({...newRule, channel: c})}
                                                className={cn(
                                                    "flex-1 h-12 rounded-xl text-[8px] font-black uppercase border-2 transition-all",
                                                    newRule.channel === c ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                                                )}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Automated Action (Payload)</label>
                                <Input
                                    value={newRule.action}
                                    onChange={e => setNewRule({...newRule, action: e.target.value})}
                                    className="h-14 rounded-2xl bg-secondary border-border font-medium text-foreground"
                                    placeholder="e.g. Send 10% discount code..."
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border flex gap-4">
                            <Button
                                onClick={handleCreateRule}
                                disabled={!newRule.name || loading}
                                className="flex-1 h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Establish Node"}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
