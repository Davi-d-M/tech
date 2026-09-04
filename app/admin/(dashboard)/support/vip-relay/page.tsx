'use client';

import * as React from 'react';
import {
    Video,
    ShieldCheck,
    ArrowLeft,
    Users,
    Bot,
    Zap,
    Sparkles,
    Loader2,
    MessageSquare,
    PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function VIPVideoRelay() {
    const [isConnecting, setIsConnecting] = React.useState(false);

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <Link href="/admin/support" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-4">
                        <ArrowLeft size={14} /> Back to Command
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#5b5bff]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">VIP High-Touch Channel</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">Video Support Relay</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Direct unboxing assistance and hardware diagnostics for elite members.</p>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Live Stream Area */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="aspect-video rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl relative overflow-hidden flex items-center justify-center group">
                        <div className="text-center space-y-6 relative z-10 animate-in zoom-in-95 duration-700">
                            <div className="h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mx-auto shadow-inner relative group-hover:scale-105 transition-transform">
                                <Video size={48} />
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Waiting for Client Connection</h3>
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest italic">Status: Secure • Signal: 100%</p>
                            </div>
                            <Button
                                onClick={() => setIsConnecting(true)}
                                disabled={isConnecting}
                                className="h-16 px-12 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                {isConnecting ? <Loader2 className="animate-spin mr-3" /> : <Zap className="mr-3" />}
                                {isConnecting ? 'Connecting...' : 'Start Session'}
                            </Button>
                        </div>

                        <div className="absolute top-8 right-8 flex gap-3">
                            <div className="px-4 py-2 rounded-xl bg-slate-900/5 backdrop-blur-md border border-white/20 flex items-center gap-2">
                                <Users size={12} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase text-foreground">VIP: David M.</span>
                            </div>
                        </div>

                        <Sparkles className="absolute -bottom-10 -left-10 h-64 w-64 text-indigo-500/5 rotate-12 -z-0" />
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left group hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform"><Bot size={20} /></div>
                                <h3 className="text-lg font-black uppercase text-foreground">AI Diagnostic AI</h3>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                &quot;Our bot will automatically scan the video feed for gadget identifiers and log technical serial numbers for verification.&quot;
                            </p>
                        </Card>

                        <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left group hover:border-emerald-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform"><ShieldCheck size={20} /></div>
                                <h3 className="text-lg font-black uppercase text-foreground">Encrypted Stream</h3>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                &quot;All high-touch relay sessions are end-to-end encrypted under the Apex Platform security standards. No recordings are stored without consent.&quot;
                            </p>
                        </Card>
                    </div>
                </div>

                {/* Control Panel Sidebar */}
                <div className="lg:col-span-4 space-y-8 text-left">
                    <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Relay Controls</h3>
                            <div className="space-y-4">
                                <Button className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 text-foreground font-black uppercase text-[10px] hover:bg-white hover:shadow-lg transition-all flex items-center gap-3">
                                    <MessageSquare size={16} className="text-indigo-500" /> Open Side Chat
                                </Button>
                                <Button className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 text-foreground font-black uppercase text-[10px] hover:bg-white hover:shadow-lg transition-all flex items-center gap-3">
                                    <ShieldCheck size={16} className="text-emerald-500" /> Verify Device Ownership
                                </Button>
                                <Button className="w-full h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-black uppercase text-[10px] hover:bg-rose-600 hover:text-white transition-all flex items-center gap-3 shadow-sm">
                                    <PhoneCall size={16} /> End Session
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Sparkles size={20} /></div>
                        <h4 className="text-lg font-black uppercase text-foreground leading-none">Elite Perk Active</h4>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                            &quot;Video support is exclusive to Diamond and Legend rank members. This feature boosts customer trust by 94% on average.&quot;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
