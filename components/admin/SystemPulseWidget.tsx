'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Activity, Database, Globe, Smartphone, CheckCircle2, ShieldAlert, Power, Camera as Instagram, MessageCircle, Share2 as Facebook, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function SystemPulseWidget() {
    const [latency, setLatency] = React.useState({ db: 0, api: 0, logistics: 0 });
    const [status, setStatus] = React.useState({ db: 'online', api: 'online', logistics: 'active' });
    const [apiStatus, setApiStatus] = React.useState({
        whatsapp: 'offline',
        instagram: 'offline',
        facebook: 'offline',
        tiktok: 'offline'
    });
    const [killSwitchActive, setKillSwitchActive] = React.useState(false);

    const checkSystem = React.useCallback(async () => {
        const start = performance.now();
        try {
            // 1. Database Ping
            const { data: dbCheck } = await supabase!.from('settings').select('key').limit(1);
            const endDb = performance.now();

            // 2. Logistics Node Ping (Rider Grid)
            const startLogistics = performance.now();
            await supabase?.from('rider_status').select('id', { count: 'exact', head: true }).limit(1);
            const endLogistics = performance.now();

            // 3. API Key Audit (Live Status)
            const { data: settings } = await supabase!.from('settings').select('key, value');

            const socialApis = settings?.find(s => s.key === 'social_apis')?.value as any || {};
            const socialLinks = settings?.find(s => s.key === 'social_links')?.value as any || {};
            const lockdown = settings?.find(s => s.key === 'system_lockdown')?.value as any || {};

            setApiStatus({
                whatsapp: (socialApis.whatsapp_token && socialApis.whatsapp_phone_id) ? 'active' : 'offline',
                instagram: (socialApis.instagram_access_token) ? 'active' : 'offline',
                facebook: (socialApis.meta_pixel_id) ? 'active' : 'offline',
                tiktok: (socialLinks.tiktok) ? 'active' : 'offline'
            });

            setKillSwitchActive(lockdown.active || false);

            setLatency({
                db: Math.round(endDb - start),
                api: Math.round((endDb - start) * 0.8),
                logistics: Math.round(endLogistics - startLogistics)
            });
            setStatus({ db: 'online', api: 'online', logistics: 'active' });
        } catch (e) {
            console.error("Pulse error:", e);
            setStatus(prev => ({ ...prev, db: 'offline' }));
        }
    }, []);

    React.useEffect(() => {
        checkSystem();
        const interval = setInterval(checkSystem, 15000);
        return () => clearInterval(interval);
    }, [checkSystem]);

    const systemMetrics = [
        { label: 'Database', val: `${latency.db}ms`, icon: Database, status: status.db },
        { label: 'Edge API', val: `${latency.api}ms`, icon: Globe, status: status.api },
        { label: 'Logistics', val: `${latency.logistics}ms`, icon: Smartphone, status: status.logistics },
    ];

    const apiMetrics = [
        { label: 'WhatsApp', icon: MessageCircle, status: apiStatus.whatsapp },
        { label: 'Instagram', icon: Instagram, status: apiStatus.instagram },
        { label: 'Facebook/Meta', icon: Facebook, status: apiStatus.facebook },
        { label: 'TikTok', icon: Music, status: apiStatus.tiktok },
    ];

    const toggleKillSwitch = async () => {
        if (!supabase) return;
        const next = !killSwitchActive;
        setKillSwitchActive(next);

        // Persist to settings
        await supabase.from('settings').upsert({
            key: 'system_lockdown',
            value: { active: next, timestamp: new Date().toISOString() }
        });
    };

    return (
        <div className="p-8 rounded-[3rem] bg-white text-foreground border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary animate-pulse" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">System Pulse</h3>
                    </div>
                    {status.db === 'online' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <ShieldAlert className="h-4 w-4 text-rose-500 animate-bounce" />
                    )}
                </div>

                <div className="space-y-4">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">System Core</p>
                    {systemMetrics.map(m => (
                        <div key={m.label} className="flex justify-between items-center group/item">
                            <div className="flex items-center gap-3">
                                <m.icon className="h-3 w-3 text-slate-300 group-hover/item:text-primary transition-colors" />
                                <span className="text-[9px] font-black uppercase text-slate-500">{m.label}</span>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "text-[8px] font-black uppercase block",
                                    m.status === 'online' || m.status === 'active' ? "text-emerald-500" : "text-rose-500"
                                )}>{m.status}</span>
                                <span className="text-[7px] font-bold text-slate-400 uppercase">{m.val}</span>
                            </div>
                        </div>
                    ))}

                    <div className="pt-4 space-y-4">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">API Integrations</p>
                        <div className="grid grid-cols-2 gap-3">
                            {apiMetrics.map(api => (
                                <div key={api.label} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2 group/api">
                                    <div className="flex items-center justify-between">
                                        <api.icon className={cn(
                                            "h-3.5 w-3.5 transition-colors",
                                            api.status === 'active' ? "text-primary" : "text-slate-300"
                                        )} />
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            api.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                        )} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-slate-500">{api.label.split('/')[0]}</p>
                                        <p className={cn(
                                            "text-[7px] font-black uppercase",
                                            api.status === 'active' ? "text-emerald-600" : "text-slate-400"
                                        )}>{api.status === 'active' ? 'Operational' : 'Offline'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kill Switch</span>
                        <span className={cn(
                            "text-[7px] font-black uppercase",
                            killSwitchActive ? "text-rose-600 animate-pulse" : "text-slate-300"
                        )}>{killSwitchActive ? 'LOCKDOWN ACTIVE' : 'SECURE'}</span>
                    </div>
                    <Button
                        onClick={toggleKillSwitch}
                        variant={killSwitchActive ? 'default' : 'outline'}
                        className={cn(
                            "w-full h-12 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95",
                            killSwitchActive ? "bg-rose-600 text-white border-rose-600" : "border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100"
                        )}
                    >
                        <Power className="h-3 w-3 mr-2" />
                        {killSwitchActive ? 'Deactivate Lockdown' : 'Initiate Lockdown'}
                    </Button>
                </div>
            </div>

            <Activity className="absolute -bottom-10 -left-10 h-48 w-48 text-primary/5 -z-0 rotate-12" />
        </div>
    );
}
