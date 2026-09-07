'use client';

import * as React from 'react';
import { Bot, Zap, Copy, MessageCircle, Camera as Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const HOOKS = [
    { label: 'The Viral Hype', hook: "🔥 BRO, the new Samsung A56 just dropped at Apex and the price is INSANE! I've got a member discount link for you. Don't sleep on this one. 🏃💨" },
    { label: 'Quality Focused', hook: "💎 Tired of fake chargers? Get the 100% original 45W Super Fast Charging kit from Apex. Verified, warrantied, and delivered to your door in 2 hours. Tap in: [link]" },
    { label: 'Status Focused', hook: "🎧 Upgrade your sound game. AirPods Pro with full Spatial Audio active. Real quality, real warranty. Exclusive price for my network only. Check it out: [link]" },
    { label: 'The Deal Hunter', hook: "📉 MASSIVE PRICE DROP! Apex just slashed prices on the Premium series. Use my private link to lock in your discount before stock hits zero. 📉📈" }
];

export default function AISalesAssistant({ promoLink }: { promoLink: string }) {
    const [selectedHook, setSelectedHook] = React.useState(HOOKS[0]);

    const copyFinal = (text: string) => {
        const final = text.replace('[link]', promoLink);
        navigator.clipboard.writeText(final);
        alert("Copywriting secured! 🎯");
    };

    return (
        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Bot size={24} /></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">AI Sales Assistant</h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Generate high-converting social hooks instantly.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner"><MessageCircle size={16} /></div>
                    <div className="h-8 w-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center shadow-inner"><Instagram size={16} /></div>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Select Strategy</p>
                    <div className="space-y-2">
                        {HOOKS.map(h => (
                            <button
                                key={h.label}
                                onClick={() => setSelectedHook(h)}
                                className={cn(
                                    "w-full p-5 rounded-2xl border text-left transition-all group",
                                    selectedHook.label === h.label ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105" : "bg-slate-50 border-slate-50 text-slate-500 hover:border-primary/20"
                                )}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">{h.label}</p>
                                <p className="text-[9px] font-medium leading-tight opacity-70 line-clamp-1">{h.hook}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Live Output</span>
                            <Zap className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <p className="text-sm font-bold text-foreground leading-relaxed italic">&quot;{selectedHook.hook.replace('[link]', promoLink)}&quot;</p>
                        <div className="pt-6 border-t border-slate-200">
                             <Button onClick={() => copyFinal(selectedHook.hook)} className="w-full h-14 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl transition-all">
                                 <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
                             </Button>
                        </div>
                    </div>
                    <Bot className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12 -z-0" />
                </div>
            </div>
        </Card>
    );
}
