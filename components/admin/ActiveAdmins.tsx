'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Activity, ExternalLink, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface AdminSession {
    session_id: string;
    customer_name: string | null;
    current_page: string;
    last_active_at: string;
    latest_action?: string;
}

export default function ActiveAdmins() {
    const [activeAdmins, setActiveAdmins] = React.useState<AdminSession[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchAdmins = React.useCallback(async () => {
        if (!supabase) return;
        try {
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { data: visitors } = await supabase
                .from('active_visitors')
                .select('*')
                .gte('last_active_at', fiveMinsAgo)
                .like('current_page', '/admin%')
                .order('last_active_at', { ascending: false });

            // Enhance with latest audit log
            const { data: logs } = await supabase
                .from('audit_logs')
                .select('staff_email, action, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            const enhanced = (visitors || []).map(v => {
                const latestLog = logs?.find(l => l.staff_email === v.customer_name);
                return {
                    ...v,
                    latest_action: latestLog?.action || 'Browsing Console'
                };
            });

            setActiveAdmins(enhanced);
        } catch (err) {
            console.error("Admin tracking failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchAdmins();
        const interval = setInterval(fetchAdmins, 30000);
        return () => clearInterval(interval);
    }, [fetchAdmins]);

    if (loading && activeAdmins.length === 0) return null;

    return (
        <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group text-left">
            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Shield size={20} /></div>
                        <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em]">Active Admin Sessions</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> {activeAdmins.length} Online
                    </div>
                </div>

                <div className="space-y-4">
                    {activeAdmins.length === 0 ? (
                        <p className="py-6 text-center text-[10px] font-black text-slate-300 uppercase italic">No other active sessions.</p>
                    ) : activeAdmins.map((admin) => (
                        <div key={admin.session_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group/session transition-all hover:bg-white hover:shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-foreground font-black text-[10px] uppercase shadow-sm">
                                    {(admin.customer_name || 'AD').substring(0, 2)}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-foreground uppercase">{admin.customer_name || 'Anonymous Admin'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Viewing: {admin.current_page.split('/').pop() || 'Dashboard'}</p>
                                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                                        <p className="text-[8px] font-black text-primary uppercase">{admin.latest_action?.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-[8px] font-black text-slate-300 uppercase">{new Date(admin.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <Link href="/admin/audit" className="opacity-0 group-hover/session:opacity-100 transition-opacity">
                                    <ExternalLink size={14} className="text-primary" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Activity className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12 -z-0" />
        </Card>
    );
}
