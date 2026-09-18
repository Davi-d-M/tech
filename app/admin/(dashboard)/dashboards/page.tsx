'use client';

import * as React from 'react';
import {
    Plus,
    Maximize2,
    Activity,
    Zap,
    DollarSign,
    Trash2,
    X,
    Dna,
    Settings,
    Sparkles,
    ArrowUpRight,
    Filter,
    PieChart
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type WidgetType = 'metric' | 'chart' | 'funnel' | 'timeline';

interface Widget {
    id: string;
    title: string;
    description: string;
    type: WidgetType;
    category: 'live' | 'behavior' | 'commerce' | 'tech';
    size: 'sm' | 'md' | 'lg';
}

const WIDGET_LIBRARY: Widget[] = [
    { id: 'live-users', title: 'Live Active Personas', description: 'Real-time heartbeat count.', type: 'metric', category: 'live', size: 'sm' },
    { id: 'behavior-dna', title: 'Global DNA Average', description: 'System-wide engagement scores.', type: 'chart', category: 'behavior', size: 'md' },
    { id: 'conversion-funnel', title: 'Primary Conversion Funnel', description: 'Home -> Cart -> Purchase.', type: 'funnel', category: 'commerce', size: 'lg' },
    { id: 'tech-friction', title: 'Technical Friction Log', description: 'JS Errors & Latency spikes.', type: 'timeline', category: 'tech', size: 'md' },
    { id: 'revenue-live', title: 'Live Mission Yield', description: 'Real-time revenue attribution.', type: 'metric', category: 'commerce', size: 'sm' },
];

export default function DashboardBuilderPage() {
    const [activeDashboard, setActiveDashboard] = React.useState('Executive Intelligence');
    const [dashboards, setDashboards] = React.useState(['Executive Intelligence', 'UX Friction Audit', 'Marketing Payload']);
    const [isStudioOpen, setIsStudioOpen] = React.useState(false);
    const [selectedWidgets, setSelectedWidgets] = React.useState<string[]>(['live-users', 'behavior-dna', 'tech-friction']);

    const addWidget = (id: string) => {
        if (!selectedWidgets.includes(id)) {
            setSelectedWidgets([...selectedWidgets, id]);
            setIsStudioOpen(false);
        }
    };

    const removeWidget = (id: string) => {
        setSelectedWidgets(selectedWidgets.filter(w => w !== id));
    };

    return (
        <div className="p-8 space-y-12 animate-in fade-in duration-700 text-left selection:bg-primary/20">

            {/* BUILDER HEADER */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Tactical UI Builder</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <h1 className="text-5xl font-black text-foreground uppercase tracking-tighter">{activeDashboard}</h1>
                        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                            {dashboards.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setActiveDashboard(d)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all",
                                        activeDashboard === d ? "bg-white text-foreground shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                            <button onClick={() => setDashboards([...dashboards, `Dashboard ${dashboards.length + 1}`])} className="px-4 py-2 rounded-lg text-[8px] font-black uppercase text-primary hover:bg-white transition-all">+</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsStudioOpen(true)} className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="h-4 w-4 mr-2" /> Launch Widget Studio
                    </Button>
                    <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-100 bg-white hover:bg-slate-50">
                        <Settings className="h-4 w-4 text-slate-400" />
                    </Button>
                </div>
            </header>

            {/* THE GRID: DYNAMIC WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {selectedWidgets.map(wId => {
                    const widget = WIDGET_LIBRARY.find(w => w.id === wId);
                    if (!widget) return null;

                    return (
                        <Card
                            key={widget.id}
                            className={cn(
                                "rounded-[3.5rem] bg-white border border-slate-100 shadow-sm relative group transition-all duration-500 hover:shadow-2xl overflow-hidden",
                                widget.size === 'sm' ? "md:col-span-4 h-[300px]" :
                                widget.size === 'md' ? "md:col-span-8 h-[400px]" :
                                "md:col-span-12 h-[500px]"
                            )}
                        >
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                                        {widget.category === 'commerce' ? <DollarSign size={16} /> :
                                         widget.category === 'tech' ? <Zap size={16} /> :
                                         widget.category === 'behavior' ? <Dna size={16} /> :
                                         <Activity size={16} />}
                                    </div>
                                    <h3 className="text-xs font-black uppercase text-foreground tracking-widest">{widget.title}</h3>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-slate-300 hover:text-primary transition-colors"><Maximize2 size={14} /></button>
                                    <button onClick={() => removeWidget(widget.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="p-10 h-full flex flex-col justify-center text-center space-y-4">
                                {widget.id === 'live-users' && (
                                    <div className="space-y-2">
                                        <p className="text-6xl font-black text-foreground tracking-tighter">1,284</p>
                                        <p className="text-[10px] font-black uppercase text-emerald-500 flex items-center justify-center gap-1">
                                            <ArrowUpRight size={12} /> 14.2% Growth
                                        </p>
                                    </div>
                                )}
                                {widget.id === 'tech-friction' && (
                                    <div className="flex-1 overflow-y-auto space-y-4 text-left no-scrollbar">
                                        {[
                                            { type: 'API Latency', msg: 'Paystack Node > 800ms', time: '2m ago' },
                                            { type: 'JS Exception', msg: 'Hydration Mismatch in Header', time: '14m ago' },
                                            { type: 'Fraud Alert', msg: 'Suspicious Velocity from 192.x', time: '1h ago' },
                                        ].map((log, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group/log">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase text-rose-500">{log.type}</p>
                                                    <p className="text-[11px] font-bold text-slate-600 italic">{log.msg}</p>
                                                </div>
                                                <span className="text-[8px] font-black text-slate-300 uppercase">{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {widget.id === 'behavior-dna' && (
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1"><p className="text-[8px] font-black uppercase text-slate-400">Engagement</p><p className="text-xs font-black text-foreground">84%</p></div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner"><div className="h-full bg-primary w-[84%] shadow-lg shadow-primary/20" /></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1"><p className="text-[8px] font-black uppercase text-slate-400">Adoption</p><p className="text-xs font-black text-foreground">91%</p></div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner"><div className="h-full bg-emerald-500 w-[91%] shadow-lg shadow-emerald-500/20" /></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1"><p className="text-[8px] font-black uppercase text-slate-400">Retention</p><p className="text-xs font-black text-foreground">72%</p></div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner"><div className="h-full bg-indigo-500 w-[72%] shadow-lg shadow-indigo-500/20" /></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1"><p className="text-[8px] font-black uppercase text-slate-400">Conversion</p><p className="text-xs font-black text-foreground">5.8%</p></div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner"><div className="h-full bg-primary w-[35%] shadow-lg shadow-primary/20" /></div>
                                        </div>
                                    </div>
                                )}
                                {widget.id === 'revenue-live' && (
                                    <div className="space-y-2">
                                        <p className="text-5xl font-black text-foreground tracking-tighter">KSh 42.8K</p>
                                        <p className="text-[9px] font-black uppercase text-slate-400">Today&apos;s Attributed Payload</p>
                                    </div>
                                )}
                                {widget.id === 'conversion-funnel' && (
                                    <div className="flex-1 flex flex-col justify-between py-10 relative">
                                        {[
                                            { label: 'Opened Store', val: '12,482', p: '100%' },
                                            { label: 'Viewed Product', val: '8,921', p: '71%' },
                                            { label: 'Added to Bag', val: '2,408', p: '19%' },
                                            { label: 'Completed Checkout', val: '682', p: '5.4%' },
                                        ].map((step, i) => (
                                            <div key={i} className="relative z-10 flex items-center justify-between group/step">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center font-black text-[10px] text-primary shadow-sm">{i+1}</div>
                                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{step.label}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-foreground tracking-tighter">{step.val}</p>
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase">{step.p}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="absolute top-10 bottom-10 left-5 w-px bg-slate-100 -z-0" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}

                {/* ADD WIDGET PLACEHOLDER */}
                <button
                    onClick={() => setIsStudioOpen(true)}
                    className="md:col-span-4 h-[300px] rounded-[3.5rem] border-4 border-dashed border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all flex flex-col items-center justify-center gap-4 group"
                >
                    <div className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                        <Plus size={32} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 group-hover:text-primary transition-colors">Deploy New Widget</p>
                </button>
            </div>

            {/* WIDGET STUDIO MODAL */}
            {isStudioOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/20 backdrop-blur-xl p-4 animate-in fade-in duration-500">
                    <Card className="max-w-5xl w-full max-h-[85vh] bg-white rounded-[4rem] shadow-[0_50px_150px_-20px_rgba(0,0,0,0.3)] overflow-hidden border-none flex flex-col">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 animate-pulse"><Sparkles size={24} /></div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none">Widget Marketplace</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Intelligence Asset Library</p>
                                </div>
                            </div>
                            <button onClick={() => setIsStudioOpen(false)} className="h-12 w-12 rounded-full hover:bg-white flex items-center justify-center text-slate-300 hover:text-foreground transition-all"><X size={28} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {WIDGET_LIBRARY.map(widget => (
                                    <div
                                        key={widget.id}
                                        onClick={() => addWidget(widget.id)}
                                        className={cn(
                                            "p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:shadow-2xl hover:border-primary/20 hover:bg-white transition-all group cursor-pointer text-left space-y-6",
                                            selectedWidgets.includes(widget.id) && "opacity-40 grayscale pointer-events-none"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                {widget.type === 'metric' ? <Zap size={20} /> :
                                                 widget.type === 'funnel' ? <Filter size={20} /> :
                                                 <PieChart size={20} />}
                                            </div>
                                            <span className="text-[7px] font-black uppercase text-slate-300 border border-slate-200 px-2 py-0.5 rounded-full">{widget.category}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black uppercase text-foreground">{widget.title}</h4>
                                            <p className="text-[10px] font-medium text-slate-400 italic">{widget.description}</p>
                                        </div>
                                        <Button className="w-full h-10 rounded-xl bg-white border border-slate-200 text-slate-500 font-black uppercase text-[8px] tracking-widest group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                            {selectedWidgets.includes(widget.id) ? 'Deployed' : 'Deploy Widget'}
                                        </Button>
                                    </div>
                                ))}

                                {/* CUSTOM WIDGET CREATOR SEED */}
                                <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/[0.01] hover:bg-primary/[0.03] transition-all flex flex-col items-center justify-center gap-4 text-center group cursor-pointer">
                                    <div className="h-10 w-10 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary group-hover:rotate-90 transition-transform"><Plus size={20} /></div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black uppercase text-primary">Custom Node</h4>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Build unique data extraction</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Titan Hub Engine v4.0</p>
                            <span className="text-[9px] font-black text-primary uppercase bg-white px-4 py-2 rounded-full border border-primary/5 shadow-sm">Syncing Global Assets...</span>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
