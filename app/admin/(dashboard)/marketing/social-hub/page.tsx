'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Zap,
    CheckCircle2,
    Rocket,
    Loader2,
    Eye,
    Camera,
    MessageCircle,
    Music,
    Share2 as Facebook,
    Camera as Instagram,
    Send,
    ShieldCheck,
    Calendar,
    Globe,
    ShieldAlert
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

import { socialManager } from '@/lib/social/social-manager';
import { SocialPlatform, MasterContent } from '@/lib/social/types';
import SocialAccountManager from '@/components/admin/marketing/SocialAccountManager';
import ContentCalendar from '@/components/admin/marketing/ContentCalendar';

export default function SocialHubPage() {
    useAdmin();
    const [activeTab, setActiveTab] = React.useState<'composer' | 'calendar' | 'accounts'>('composer');

    // Composer State
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [suggestedMissions, setSuggestedMissions] = React.useState<MasterContent[]>([]);
    const [isPublishing, setIsPublishing] = React.useState(false);
    const [complianceStatus, setComplianceStatus] = React.useState<'idle' | 'checking' | 'flagged' | 'passed'>('idle');
    const [complianceReason, setComplianceReason] = React.useState('');

    const [selectedPlatforms, setSelectedPlatforms] = React.useState<SocialPlatform[]>(['instagram', 'tiktok']);
    const [previewPlatform, setPreviewPlatform] = React.useState<SocialPlatform>('instagram');

    React.useEffect(() => {
        async function fetchDrafts() {
            if (!supabase) return;
            const { data } = await supabase.from('content_library').select('*').eq('status', 'draft').limit(2);
            if (data) setSuggestedMissions(data.map(d => ({
                id: d.id,
                title: d.title,
                description: d.description || '',
                contentType: d.content_type as MasterContent['contentType'],
                masterMediaUrl: d.master_media_url || '',
                productIds: d.product_ids || []
            })));
        }
        fetchDrafts();
    }, []);

    const togglePlatform = (p: SocialPlatform) => {
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );
    };

    const handleCheckCompliance = async () => {
        setComplianceStatus('checking');
        // 🛰️ Real-Data Compliance Scanning
        try {
            if (!supabase) return;
            const { data: rules } = await supabase.from('compliance_rules').select('*').eq('is_active', true);

            const found = rules?.filter(rule => {
                const regex = new RegExp(rule.pattern, 'i');
                return regex.test(title + description);
            });

            if (found && found.length > 0) {
                setComplianceStatus('flagged');
                setComplianceReason(`Potential breach: ${found[0].name}. Audit required.`);
            } else {
                setComplianceStatus('passed');
            }
        } catch (err) {
            console.error("Compliance Sync Error:", err);
            setComplianceStatus('idle');
        }
    };

    const handleBroadcast = async () => {
        if (complianceStatus !== 'passed') {
            await handleCheckCompliance();
            if (complianceStatus === 'flagged') return;
        }

        setIsPublishing(true);
        try {
            const masterContent = {
                id: `cnt_${Date.now()}`,
                title,
                description,
                contentType: 'product_story' as const,
                masterMediaUrl: '', // To be added via upload
                productIds: []
            };

            await socialManager.broadcastMasterContent(masterContent, selectedPlatforms);
            alert("Content Synchronized. Publishing jobs enqueued. 🚀");
            setTitle('');
            setDescription('');
            setComplianceStatus('idle');
        } catch (error) {
            console.error("Broadcast Failure:", error);
            alert("Broadcast sequence failed. Database link unstable.");
        } finally {
            setIsPublishing(false);
        }
    };

    const platformIcons: Record<SocialPlatform, { icon: React.ElementType; color: string; bg: string }> = {
        facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
        instagram: { icon: Instagram, color: 'text-rose-500', bg: 'bg-rose-50' },
        tiktok: { icon: Music, color: 'text-slate-900', bg: 'bg-slate-100' },
        whatsapp: { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        youtube: { icon: Send, color: 'text-rose-600', bg: 'bg-rose-50' },
        x: { icon: Globe, color: 'text-foreground', bg: 'bg-slate-100' }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Content Command Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Omni Hub</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Single-origin content distribution and reach analytics.</p>
                </div>

                <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    {[
                        { id: 'composer', label: 'Composer', icon: Camera },
                        { id: 'calendar', label: 'Calendar', icon: Calendar },
                        { id: 'accounts', label: 'Infrastructure', icon: ShieldCheck }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'composer' | 'calendar' | 'accounts')}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab.id ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'composer' && (
                <div className="grid lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
                    {/* MASTER COMPOSER */}
                    <Card className="lg:col-span-7 p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Mission Brief</h2>
                            <span className="text-[10px] font-black uppercase text-slate-300">Omni-Channel Variant Generator</span>
                        </div>

                        {suggestedMissions.length > 0 && !title && (
                            <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-4">
                                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2"><Rocket size={12} /> Suggested Protocol</p>
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-black text-indigo-900 uppercase">{suggestedMissions[0].title}</h4>
                                    <button
                                        onClick={() => { setTitle(suggestedMissions[0].title); setDescription(suggestedMissions[0].description); }}
                                        className="text-[9px] font-black text-indigo-600 underline uppercase tracking-widest"
                                    >Load Mission</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Master Title</label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Next-Gen Tech Upgrade Mission 🔥"
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg text-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Master Caption</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full h-40 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-foreground font-medium text-sm outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    placeholder="Describe the mission details..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Node Deployment (Platforms)</label>
                                <div className="flex flex-wrap gap-3">
                                    {(Object.keys(platformIcons) as SocialPlatform[]).map(p => (
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

                            {/* COMPLIANCE HUD */}
                            <div className={cn(
                                "p-6 rounded-[2.5rem] border-2 flex items-start gap-4 transition-all",
                                complianceStatus === 'passed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                complianceStatus === 'flagged' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                "bg-slate-50 border-slate-100 text-slate-400"
                            )}>
                                {complianceStatus === 'checking' ? <Loader2 className="h-6 w-6 animate-spin mt-1" /> :
                                 complianceStatus === 'passed' ? <CheckCircle2 size={24} /> :
                                 <ShieldAlert size={24} />}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">Compliance Node: {complianceStatus.toUpperCase()}</p>
                                    <p className="text-[10px] font-medium italic mt-1">
                                        {complianceStatus === 'passed' ? "Content cleared for regional distribution." :
                                         complianceStatus === 'flagged' ? complianceReason :
                                         "Awaiting content scan..."}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex gap-4">
                                <Button
                                    onClick={handleBroadcast}
                                    disabled={isPublishing || !title || !description}
                                    className="flex-1 h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    {isPublishing ? <Loader2 className="animate-spin h-6 w-6" /> : <><Rocket className="h-5 w-5 mr-3" /> Synchronize & Publish</>}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* PREVIEW HUB */}
                    <div className="lg:col-span-5 space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><Eye className="h-3 w-3" /> Tactical Preview</h3>
                                <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    {selectedPlatforms.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPreviewPlatform(p)}
                                            className={cn(
                                                "p-2 rounded-lg transition-all",
                                                previewPlatform === p ? "bg-slate-100 text-foreground" : "text-slate-300"
                                            )}
                                        >
                                            {React.createElement(platformIcons[p].icon, { size: 14 })}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Card className="rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl overflow-hidden min-h-[560px] flex flex-col p-1">
                                <div className="flex-1 rounded-[3rem] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                                        {React.createElement(platformIcons[previewPlatform].icon, { size: 64, className: "text-slate-200" })}
                                    </div>
                                    <div className="relative z-10 text-center space-y-2 p-10">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">{previewPlatform} variant</p>
                                        <h4 className="text-xl font-black uppercase text-foreground leading-tight">{title || 'Post Header'}</h4>
                                        <p className="text-xs font-medium text-slate-500 line-clamp-3 italic">{description || 'Caption preview...'}</p>
                                    </div>
                                </div>
                                <div className="p-6 text-center border-t border-slate-50">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Format: {previewPlatform === 'tiktok' ? 'Video (9:16)' : 'Image (4:5)'}</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'calendar' && <ContentCalendar />}
            {activeTab === 'accounts' && <SocialAccountManager />}
        </div>
    );
}
