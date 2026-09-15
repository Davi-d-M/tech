'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Smartphone,
    Rocket,
    Zap,
    Save,
    Eye,
    Plus,
    Loader2,
    Target,
    ImageIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface AppWidget {
    id: string;
    name: string;
    title: string;
    description: string;
    image_url: string;
    button_text: string;
    destination: string;
    is_enabled: boolean;
    priority: number;
    target_segment: string;
}

export default function WidgetHub() {
    useAdmin();
    const [widgets, setWidgets] = React.useState<AppWidget[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [activeWidget, setActiveWidget] = React.useState<Partial<AppWidget> | null>(null);

    const fetchWidgets = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('app_widgets').select('*').order('priority', { ascending: false });
            setWidgets(data || []);
            if (data && data.length > 0) setActiveWidget(data[0]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchWidgets();
    }, [fetchWidgets]);

    const handleSave = async () => {
        if (!activeWidget || !supabase) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('app_widgets').upsert(activeWidget);
            if (error) throw error;
            alert("Widget Configuration Deployed to Grid! 🚀");
            fetchWidgets();
        } catch (err: unknown) {
            const error = err as Error;
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Device Experience Node</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Widget Hub</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Remotely control your customers&apos; Android home screens.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setActiveWidget({ name: 'New Widget', title: 'Elite Tech Upgrade', button_text: 'Shop Now' })} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest"><Plus className="h-4 w-4 mr-2" /> New Widget</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Deploy Widget
                    </Button>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* WIDGET LIST */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Active Mission Grid</h2>
                    <div className="space-y-3">
                        {loading ? (
                            [...Array(3)].map((_, i) => <Card key={i} className="h-24 rounded-3xl animate-pulse bg-white border-slate-100" />)
                        ) : widgets.length === 0 ? (
                            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem] opacity-40">
                                <Rocket className="h-8 w-8 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase">No missions defined</p>
                            </div>
                        ) : widgets.map(w => (
                            <Card
                                key={w.id}
                                onClick={() => setActiveWidget(w)}
                                className={cn(
                                    "p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer group hover:shadow-xl",
                                    activeWidget?.id === w.id ? "border-primary bg-white shadow-lg" : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase text-foreground">{w.name}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Priority: {w.priority}</p>
                                    </div>
                                    <div className={cn("h-2 w-2 rounded-full", w.is_enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* VISUAL COMPOSER */}
                {activeWidget && (
                    <div className="lg:col-span-8 grid md:grid-cols-2 gap-10 animate-in fade-in duration-500">
                        <Card className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-8 text-left">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Content Engine</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Internal Name</label>
                                    <Input value={activeWidget.name || ''} onChange={e => setActiveWidget({...activeWidget, name: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Headline (Widget Title)</label>
                                    <Input value={activeWidget.title || ''} onChange={e => setActiveWidget({...activeWidget, title: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-black text-foreground" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                                    <Textarea value={activeWidget.description || ''} onChange={e => setActiveWidget({...activeWidget, description: e.target.value})} className="h-24 rounded-2xl bg-slate-50 border-slate-100 text-sm font-medium" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Button Text</label>
                                        <Input value={activeWidget.button_text || ''} onChange={e => setActiveWidget({...activeWidget, button_text: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Route</label>
                                        <Input value={activeWidget.destination || ''} onChange={e => setActiveWidget({...activeWidget, destination: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Asset URL (Image)</label>
                                    <div className="flex gap-2">
                                        <Input value={activeWidget.image_url || ''} onChange={e => setActiveWidget({...activeWidget, image_url: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 flex-1" />
                                        <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200"><ImageIcon size={18} /></Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* LIVE PREVIEW */}
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] px-2 flex items-center gap-2"><Eye className="h-3 w-3" /> Glance Preview (Medium)</h3>

                            <div className="w-full max-w-[400px] mx-auto aspect-[16/9] bg-slate-50 rounded-[2.5rem] p-1 shadow-2xl relative group overflow-hidden border-8 border-slate-100">
                                <div className="h-full w-full bg-white rounded-[2rem] overflow-hidden flex flex-col p-6 text-left relative">
                                    {activeWidget.image_url && (
                                        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 blur-xl">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={activeWidget.image_url} alt="" className="h-full w-full object-cover" />
                                        </div>
                                    )}
                                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="h-1 w-8 bg-primary rounded-full mb-4" />
                                            <h4 className="text-xl font-black uppercase tracking-tighter text-foreground leading-none">{activeWidget.title || 'Elite Tech Protocol'}</h4>
                                            <p className="text-[10px] font-medium text-slate-500 line-clamp-2 italic leading-relaxed">{activeWidget.description || 'Remote configuration pending sync...'}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Apex OS v2.0</span>
                                            <Button size="sm" className="h-9 px-5 rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest">{activeWidget.button_text || 'Open App'}</Button>
                                        </div>
                                    </div>
                                    <Zap className="absolute -bottom-6 -right-6 h-24 w-24 text-primary/5 rotate-12 -z-0" />
                                </div>
                            </div>

                            <Card className="p-8 rounded-[3rem] bg-indigo-50 border border-indigo-100 text-left space-y-4">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-indigo-600" />
                                    <h4 className="text-sm font-black uppercase tracking-widest text-indigo-900">Distribution Logic</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <span className="text-indigo-400">Target Segment</span>
                                        <span className="text-indigo-900">Diamond Members</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <span className="text-indigo-400">Sync Signal</span>
                                        <span className="text-indigo-900 flex items-center gap-2">FCM Socket Active <Zap size={10} className="fill-current" /></span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
