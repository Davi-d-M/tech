'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    RefreshCcw,
    Plus,
    ShieldCheck,
    MoreVertical,
    Loader2,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SocialPlatform, SocialAccount } from '@/lib/social/types';

const PLATFORM_CONFIG: Record<SocialPlatform, { icon: string; color: string; bg: string }> = {
    'facebook': { icon: 'Facebook', color: 'text-blue-600', bg: 'bg-blue-50' },
    'instagram': { icon: 'Instagram', color: 'text-rose-500', bg: 'bg-rose-50' },
    'tiktok': { icon: 'Music', color: 'text-slate-900', bg: 'bg-slate-100' },
    'youtube': { icon: 'Video', color: 'text-rose-600', bg: 'bg-rose-50' },
    'x': { icon: 'Globe', color: 'text-foreground', bg: 'bg-slate-100' },
    'whatsapp': { icon: 'MessageCircle', color: 'text-emerald-500', bg: 'bg-emerald-50' }
};

export default function SocialAccountManager() {
    const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isConnecting, setIsConnecting] = React.useState<SocialPlatform | null>(null);

    const fetchAccounts = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('social_accounts').select('*');
            setAccounts(data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleConnect = async (platform: SocialPlatform) => {
        setIsConnecting(platform);
        // OAuth 2.0 Flow Initiation
        // window.location.href = `/api/social/auth/${platform}`;

        // Simulation for Phase 2
        await new Promise(r => setTimeout(r, 2000));
        await supabase?.from('social_accounts').upsert({
            platform,
            account_name: `Apex stores ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
            account_id: `acc_${Date.now()}`,
            status: 'connected',
            connected_at: new Date().toISOString()
        });

        await fetchAccounts();
        setIsConnecting(null);
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm("Confirm disconnection of this node?")) return;
        await supabase?.from('social_accounts').delete().eq('id', id);
        await fetchAccounts();
    };

    return (
        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-10 text-left">
            <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Social Infrastructure</h2>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Node Connection & OAuth Control</p>
                    </div>
                </div>
                <Button onClick={fetchAccounts} variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-white transition-all shadow-sm">
                    <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.keys(PLATFORM_CONFIG) as SocialPlatform[]).map(p => {
                    const account = accounts.find(a => a.platform === p);
                    const config = PLATFORM_CONFIG[p];

                    return (
                        <div key={p} className={cn(
                            "p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden group h-full flex flex-col justify-between",
                            account ? "bg-white border-slate-50 shadow-sm hover:shadow-xl" : "bg-slate-50 border-slate-100 opacity-60 hover:opacity-100"
                        )}>
                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm", config.bg, config.color)}>
                                        <Zap className="h-6 w-6" /> {/* Placeholder for Dynamic Lucide Icon */}
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                        account?.status === 'connected' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                                    )}>
                                        {account?.status || 'Offline'}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight text-foreground">{p}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate max-w-full">
                                        {account ? account.accountName : 'Node Unauthorized'}
                                    </p>
                                </div>

                                {account ? (
                                    <div className="flex gap-2 pt-4 border-t border-slate-50">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDisconnect(account.id)}
                                            className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50"
                                        >Disconnect</Button>
                                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100"><MoreVertical size={16} /></Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => handleConnect(p)}
                                        disabled={isConnecting === p}
                                        className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95 mt-4"
                                    >
                                        {isConnecting === p ? <Loader2 className="animate-spin h-4 w-4" /> : <><Plus size={14} className="mr-2" /> Connect Node</>}
                                    </Button>
                                )}
                            </div>

                            {account && (
                                <ShieldCheck className="absolute -bottom-6 -right-6 h-32 w-32 text-emerald-500/5 rotate-12 -z-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-start gap-6">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0 border border-indigo-100">
                    <ShieldCheck size={24} />
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase text-indigo-900">Security Briefing</p>
                    <p className="text-[10px] text-indigo-700 font-medium leading-relaxed italic">
                        &quot;All social account tokens are encrypted server-side using AES-256-GCM.
                        Apex OS only requests standard publishing scopes. We never store or transmit account passwords.&quot;
                    </p>
                </div>
            </div>
        </Card>
    );
}
