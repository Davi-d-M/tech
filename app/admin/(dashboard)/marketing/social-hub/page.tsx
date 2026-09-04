'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Globe,
    Zap,
    RefreshCcw,
    CheckCircle2,
    Rocket,
    Loader2,
    Eye,
    Smartphone,
    Share2,
    BarChart3,
    ArrowUpRight,
    Camera,
    MessageCircle,
    Music,
    Share2 as Facebook,
    Camera as Instagram,
    Send
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { socialService, Platform, PlatformResponse } from '@/lib/socialService';
import WhatsAppPreview from '@/components/admin/marketing/WhatsAppPreview';
import EmailPreview from '@/components/admin/marketing/EmailPreview';

interface Integration {
    platform: Platform;
    account_name: string;
    is_connected: boolean;
}

export default function SocialHubPage() {
    useAdmin();
    const [loading, setLoading] = React.useState(true);
    const [integrations, setIntegrations] = React.useState<Integration[]>([]);
    const [isPublishing, setIsPublishing] = React.useState(false);
    const [results, setResults] = React.useState<PlatformResponse[] | null>(null);

    // Master Campaign Form
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [overrides, setOverrides] = React.useState<Partial<Record<Platform, { title?: string; description?: string }>>>({});
    const [activeEditTab, setActiveEditTab] = React.useState<'master' | Platform>('master');

    const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>(['facebook', 'instagram']);
    const [previewPlatform, setPreviewPlatform] = React.useState<Platform>('instagram');

    const fetchIntegrations = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('social_integrations').select('platform, account_name, is_connected');
            setIntegrations(data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchIntegrations();
    }, [fetchIntegrations]);

    const togglePlatform = (p: Platform) => {
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );
    };

    const handlePublish = async () => {
        if (!title || !description || selectedPlatforms.length === 0) return;
        setIsPublishing(true);
        setResults(null);
        try {
            // Map selected platforms to their specific content (override or master)
            // const payloads = selectedPlatforms.map(p => ({
            //     platform: p,
            //     title: overrides[p]?.title || title,
            //     description: overrides[p]?.description || description
            // }));

            // In a real scenario, socialService.publishEverywhere might need to be updated to accept multiple payloads
            // For now, we'll simulate the multi-content publish
            const res = await socialService.publishEverywhere({
                title, // Fallback master
                description, // Fallback master
                platforms: selectedPlatforms,
                media_type: 'image',
                // payloadOverrides: payloads // Hypothetical future API
            });

            setResults(res);
            setTitle('');
            setDescription('');
            setOverrides({});
        } catch (e) {
            console.error("Publishing failure", e);
        } finally {
            setIsPublishing(false);
        }
    };

    const platformIcons: Record<Platform, { icon: React.ElementType; color: string; bg: string }> = {
        facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
        instagram: { icon: Instagram, color: 'text-rose-500', bg: 'bg-rose-50' },
        tiktok: { icon: Music, color: 'text-foreground', bg: 'bg-slate-100' },
        whatsapp: { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        gmail: { icon: Globe, color: 'text-rose-600', bg: 'bg-rose-50' }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Content Distribution Network</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Social Hub</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">One-click content distribution and engagement analytics.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchIntegrations} variant="outline" className="rounded-xl h-11 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest"><RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Accounts</Button>
                </div>
            </header>

            {/* CONNECTION RADAR */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {(['facebook', 'instagram', 'tiktok', 'whatsapp', 'gmail'] as Platform[]).map(p => {
                    const conn = integrations.find(i => i.platform === p);
                    const config = platformIcons[p];
                    return (
                        <Card key={p} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", config.bg, config.color)}>
                                    <config.icon className="h-6 w-6" />
                                </div>
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    conn?.is_connected ? "bg-emerald-500 animate-pulse" : "bg-slate-200"
                                )} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{p}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate">{conn?.is_connected ? conn.account_name : 'Not Connected'}</p>
                            </div>
                            <Button variant="ghost" className="mt-4 h-10 w-full rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 border border-slate-50">
                                {conn?.is_connected ? 'Manage' : 'Connect'}
                            </Button>
                        </Card>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* MASTER COMPOSER */}
                <Card className="lg:col-span-7 p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Content Composer</h2>
                        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                            <button
                                onClick={() => setActiveEditTab('master')}
                                className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all", activeEditTab === 'master' ? "bg-white text-primary shadow-sm" : "text-slate-400")}
                            >Master</button>
                            <button
                                onClick={() => setActiveEditTab(previewPlatform)}
                                className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all", activeEditTab !== 'master' ? "bg-white text-primary shadow-sm" : "text-slate-400")}
                            >Override: {previewPlatform}</button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                {activeEditTab === 'master' ? 'Global Title' : `${activeEditTab.toUpperCase()} Specific Title`}
                            </label>
                            <Input
                                value={activeEditTab === 'master' ? title : (overrides[activeEditTab as Platform]?.title ?? title)}
                                onChange={e => {
                                    if (activeEditTab === 'master') setTitle(e.target.value);
                                    else setOverrides(prev => ({ ...prev, [activeEditTab]: { ...prev[activeEditTab as Platform], title: e.target.value } }));
                                }}
                                placeholder="e.g. New iPhone 17 Pro Launch 🔥"
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                {activeEditTab === 'master' ? 'Global Caption' : `${activeEditTab.toUpperCase()} Specific Caption`}
                            </label>
                            <textarea
                                value={activeEditTab === 'master' ? description : (overrides[activeEditTab as Platform]?.description ?? description)}
                                onChange={e => {
                                    if (activeEditTab === 'master') setDescription(e.target.value);
                                    else setOverrides(prev => ({ ...prev, [activeEditTab]: { ...prev[activeEditTab as Platform], description: e.target.value } }));
                                }}
                                className="w-full h-40 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-foreground font-medium text-sm outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                placeholder="Describe the elite essentials..."
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deployment Targets (Platforms)</label>
                            <div className="flex flex-wrap gap-3">
                                {(['facebook', 'instagram', 'tiktok', 'whatsapp', 'gmail'] as Platform[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => togglePlatform(p)}
                                        className={cn(
                                            "flex items-center gap-3 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                                            selectedPlatforms.includes(p) ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-400 border border-slate-100 hover:text-foreground"
                                        )}
                                    >
                                        {React.createElement(platformIcons[p].icon, { size: 14 })}
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 flex gap-4">
                            <Button
                                onClick={handlePublish}
                                disabled={isPublishing || !title || !description}
                                className="flex-1 h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                            >
                                {isPublishing ? <Loader2 className="animate-spin h-6 w-6" /> : <><Rocket className="h-5 w-5 mr-3" /> Publish Everywhere</>}
                            </Button>
                            <Button variant="outline" className="h-20 w-20 rounded-[2rem] border-slate-200">
                                <Camera className="h-6 w-6 text-slate-400" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* PLATFORM PREVIEW */}
                <div className="lg:col-span-5 space-y-10">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><Eye className="h-3 w-3" /> Content Preview</h3>
                            <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-[250px]">
                                {(['instagram', 'facebook', 'tiktok', 'whatsapp', 'gmail'] as Platform[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            setPreviewPlatform(p);
                                            if (activeEditTab !== 'master') setActiveEditTab(p);
                                        }}
                                        className={cn(
                                            "p-2 rounded-lg transition-all flex-shrink-0",
                                            previewPlatform === p ? "bg-slate-100 text-foreground shadow-inner" : "text-slate-300 hover:text-foreground"
                                        )}
                                    >
                                        {React.createElement(platformIcons[p].icon, { size: 14 })}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Card className="rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl overflow-hidden min-h-[560px] flex flex-col">
                            {/* Instagram Style Preview */}
                            {previewPlatform === 'instagram' && (
                                <div className="animate-in fade-in duration-500 h-full flex flex-col">
                                    <div className="p-5 flex items-center gap-3 border-b border-slate-50">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5"><div className="h-full w-full rounded-full bg-white border-2 border-white overflow-hidden"><Zap className="h-full w-full bg-slate-100 text-primary p-1" /></div></div>
                                        <span className="text-[10px] font-black uppercase tracking-tight text-foreground">Apexstores_Kenya</span>
                                    </div>
                                    <div className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center"><Smartphone className="h-20 w-20 text-slate-200" /></div>
                                        <div className="relative z-10 text-center space-y-2 p-10">
                                            <h4 className="text-xl font-black uppercase text-foreground leading-tight">{overrides['instagram']?.title || title || 'Post Header'}</h4>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-3 flex-1">
                                        <div className="flex gap-4">
                                            <Instagram className="h-5 w-5" /><Share2 className="h-5 w-5" /><Send className="h-5 w-5" />
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                                            <span className="font-black text-foreground mr-2">Apexstores_Kenya</span>
                                            {overrides['instagram']?.description || description || 'Preparing description...'}
                                            <span className="block mt-2 text-primary font-bold">#Apexstores #EliteTech #KenyaTech</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TikTok Style Preview */}
                            {previewPlatform === 'tiktok' && (
                                <div className="animate-in slide-in-from-bottom-4 duration-500 bg-primary text-white h-[560px] flex flex-col">
                                    <div className="flex-1 relative flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                                        <Music className="h-32 w-32 text-white/5 animate-pulse" />
                                        <div className="absolute bottom-10 left-6 right-16 z-20 space-y-4">
                                            <h4 className="text-sm font-black uppercase tracking-widest">@apexstores.ke</h4>
                                            <p className="text-xs font-medium line-clamp-3">🚨 NEW TECH DROP 🚨 {overrides['tiktok']?.description || description || 'Preparing campaign brief...'}</p>
                                            <div className="flex items-center gap-2">
                                                <Music size={12} className="animate-spin" />
                                                <span className="text-[10px] font-bold">Original Sound - Apex stores</span>
                                            </div>
                                        </div>
                                        <div className="absolute right-4 bottom-10 z-20 flex flex-col gap-6">
                                            <div className="flex flex-col items-center gap-1"><div className="h-10 w-10 rounded-full bg-slate-100/20 backdrop-blur-xl flex items-center justify-center"><Zap size={20} /></div><span className="text-[8px] font-black">4.2k</span></div>
                                            <div className="flex flex-col items-center gap-1"><div className="h-10 w-10 rounded-full bg-slate-100/20 backdrop-blur-xl flex items-center justify-center"><Share2 size={20} /></div><span className="text-[8px] font-black">1.2k</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewPlatform === 'facebook' && (
                                <div className="animate-in fade-in duration-500 p-6 space-y-6 h-full">
                                     <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-primary"><Facebook size={20} /></div>
                                        <div>
                                            <h4 className="text-xs font-black text-foreground">Apexstores Kenya</h4>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sponsored • Global</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{overrides['facebook']?.description || description || 'Generating sales copy...'}</p>
                                    <div className="rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                                        <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-200"><Smartphone size={40} /></div>
                                        <div className="p-4 flex justify-between items-center bg-white border-t border-slate-100">
                                            <div className="text-left">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">apexstores.co.ke</p>
                                                <h5 className="text-sm font-black text-foreground uppercase truncate max-w-[200px]">{overrides['facebook']?.title || title || 'New Product'}</h5>
                                            </div>
                                            <Button size="sm" className="h-9 px-4 rounded-xl bg-slate-100 text-foreground font-black uppercase text-[9px] border border-slate-200">Shop Now</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewPlatform === 'whatsapp' && (
                                <WhatsAppPreview
                                    imageUrl=""
                                    body={overrides['whatsapp']?.description || description || 'Campaign details...'}
                                />
                            )}

                            {previewPlatform === 'gmail' && (
                                <EmailPreview
                                    productName={overrides['gmail']?.title || title || 'Product Launch'}
                                    productPrice={15000}
                                    imageUrl=""
                                    subject={overrides['gmail']?.title || title || 'Strategic Update'}
                                    body={overrides['gmail']?.description || description || 'Preparing product details...'}
                                />
                            )}
                        </Card>
                    </div>

                    <Card className="p-8 rounded-[3rem] bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <h3 className="text-sm font-black uppercase tracking-widest">Account Intelligence</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Total Reach</p>
                                    <p className="text-2xl font-black tracking-tighter">124.8k</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-emerald-400 uppercase">ROI Pulse</p>
                                    <p className="text-2xl font-black tracking-tighter text-emerald-400">+23.5%</p>
                                </div>
                            </div>
                        </div>
                        <ArrowUpRight className="absolute -bottom-6 -right-6 h-32 w-32 text-white/5 rotate-12" />
                    </Card>
                </div>
            </div>

            {/* RESULTS MODAL (Campaign Response) */}
            {results && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md p-6">
                    <Card className="max-w-xl w-full p-10 rounded-[3rem] bg-white shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 text-left">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Rocket size={28} /></div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Campaign Debrief</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Multi-Platform Distribution Report</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {results.map(r => (
                                <div key={r.platform} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", platformIcons[r.platform].bg, platformIcons[r.platform].color)}>
                                            {React.createElement(platformIcons[r.platform].icon, { size: 18 })}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-foreground">{r.platform}</p>
                                            <p className={cn("text-[9px] font-black uppercase mt-0.5", r.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500')}>
                                                {r.status === 'SUCCESS' ? 'Published successfully' : `Failure: ${r.error}`}
                                            </p>
                                        </div>
                                    </div>
                                    {r.status === 'SUCCESS' && <CheckCircle2 className="text-emerald-500 h-5 w-5" />}
                                </div>
                            ))}
                        </div>

                        <Button onClick={() => setResults(null)} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                            Close Report
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}
