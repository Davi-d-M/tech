'use client';

import * as React from 'react';
import {
    Layout,
    Image as ImageIcon,
    Share2,
    Camera,
    Music,
    Loader2,
    CheckCircle2,
    Zap,
    Rocket,
    Globe
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ContentStudio() {
    const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>(['instagram', 'tiktok']);
    const [caption, setCaption] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'success'>('idle');

    const togglePlatform = (p: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        // Simulate AI Caption Generation
        await new Promise(r => setTimeout(r, 2000));
        setCaption("Elevate your sound with the new AMAYA AM-05. Crystal clear audio, 20-hour battery, and a sleek mirror finish. 🎧✨ #Apexstores #EliteAudio #GadgetLover");
        setIsGenerating(false);
    };

    const handlePublish = async () => {
        setIsGenerating(true);
        // Simulate Multi-Channel Publishing
        await new Promise(r => setTimeout(r, 3000));
        setStatus('success');
        setIsGenerating(false);
        setTimeout(() => setStatus('idle'), 5000);
    };

    return (
        <Card className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group text-left">
            <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                            <Rocket className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Content Studio</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Publish Protocol V3</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                    {/* LEFT: POST CONFIG */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">1. Distribution Channels</p>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { id: 'instagram', icon: Camera, color: 'rose' },
                                    { id: 'tiktok', icon: Music, color: 'slate' },
                                    { id: 'facebook', icon: Globe, color: 'blue' },
                                    { id: 'whatsapp', icon: Share2, color: 'emerald' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => togglePlatform(p.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest",
                                            selectedPlatforms.includes(p.id)
                                                ? `bg-${p.color}-500 border-${p.color}-500 text-white shadow-lg`
                                                : "bg-white border-slate-100 text-slate-400 hover:border-primary/20"
                                        )}
                                    >
                                        <p.icon size={16} />
                                        {p.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Creative Payload</p>
                                <button
                                    onClick={handleGenerate}
                                    className="text-[8px] font-black uppercase text-primary hover:underline flex items-center gap-2"
                                >
                                    <Zap size={10} className="fill-current" /> AI Generate Caption
                                </button>
                            </div>
                            <textarea
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                className="w-full h-40 p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-xs font-medium leading-relaxed resize-none outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                placeholder="Enter post caption or trigger AI..."
                            />
                        </div>

                        <Button
                            onClick={handlePublish}
                            disabled={isGenerating || !caption}
                            className="w-full h-16 rounded-[1.8rem] bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-black active:scale-95 transition-all"
                        >
                            {isGenerating ? <Loader2 className="animate-spin mr-3" /> : <Rocket size={18} className="mr-3" />}
                            Execute Distribution
                        </Button>
                    </div>

                    {/* RIGHT: PREVIEW HUB */}
                    <div className="space-y-8">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Tactical Preview</p>
                        <div className="aspect-[4/5] bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner flex flex-col p-8 space-y-6">
                            <div className="h-full w-full rounded-2xl bg-white border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                                <ImageIcon size={48} className="text-slate-100 group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="h-1.5 w-12 bg-slate-200 rounded-full" />
                                    <div className="h-1.5 w-8 bg-slate-100 rounded-full" />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic line-clamp-3">
                                    {caption || "Distribution caption will appear here..."}
                                </p>
                            </div>
                        </div>

                        {status === 'success' && (
                            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                <CheckCircle2 className="text-emerald-500" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-emerald-900">Campaign Synchronized</p>
                                    <p className="text-[9px] font-medium text-emerald-600 italic mt-0.5">Link attribution active across {selectedPlatforms.length} nodes.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Layout className="absolute -bottom-10 -left-10 h-64 w-64 text-slate-50 rotate-12 -z-0" />
        </Card>
    );
}
