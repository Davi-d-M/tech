'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    CheckCircle2,
    Clock,
    ChevronRight,
    Store,
    ShieldCheck,
    Zap,
    Loader2,
    RefreshCcw,
    Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { provisioningEngine } from '@/lib/apex-os/provisioning';

interface OnboardingApplication {
    id: string;
    business_name: string;
    owner_name: string;
    phone: string;
    email: string;
    business_type: string;
    employee_count: number;
    branch_count: number;
    monthly_orders: string;
    current_system: string;
    risk_score: number;
    verification_status: 'Pending' | 'Verified' | 'Rejected' | 'Approved';
    created_at: string;
}

export default function OnboardingReviewPage() {
    const { role } = useAdmin();
    const [apps, setApps] = React.useState<OnboardingApplication[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedApp, setSelectedApp] = React.useState<OnboardingApplication | null>(null);
    const [provisioning, setProvisioning] = React.useState(false);

    const fetchApps = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('onboarding_applications')
                .select('*')
                .order('created_at', { ascending: false });
            setApps((data as OnboardingApplication[]) || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    const handleApprove = async (id: string) => {
        if (!supabase) return;
        setProvisioning(true);
        try {
            // 1. Mark as Approved
            const { error: updateError } = await supabase
                .from('onboarding_applications')
                .update({ verification_status: 'Approved' })
                .eq('id', id);

            if (updateError) throw updateError;

            // 2. Spawn Organization via Provisioning Engine
            const { tenantId, ownerInviteLink } = await provisioningEngine.provisionOrganization(id);

            alert(`Organization Provisioned!\nTenant ID: ${tenantId}\n\nOwner Invite: ${ownerInviteLink}`);
            fetchApps();
            setSelectedApp(null);
        } catch (e) {
            console.error(e);
            alert("Provisioning Failure: Check system logs.");
        } finally {
            setProvisioning(false);
        }
    };

    if (role !== 'owner' && role !== 'admin') {
        return <div className="p-20 text-center uppercase font-black text-rose-500 tracking-widest">Unauthorized Access: Command Credentials Required</div>;
    }

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Onboarding Command Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Retailer Applications</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Review and provision new organizations to the Apex Grid.</p>
                </div>
                <Button onClick={fetchApps} variant="outline" className="rounded-xl h-11 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                    <RefreshCcw className={cn("h-3 w-3 mr-2", loading && "animate-spin")} /> Sync Radar
                </Button>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Application Feed */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex gap-4 mb-4 overflow-x-auto no-scrollbar pb-2">
                        {['All', 'Pending', 'Verified', 'Approved', 'Rejected'].map(status => (
                            <button key={status} className="px-5 py-2 rounded-xl bg-white border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            [...Array(3)].map((_, i) => <Card key={i} className="h-32 rounded-[2.5rem] bg-white animate-pulse" />)
                        ) : apps.length === 0 ? (
                            <div className="py-20 text-center opacity-30 italic font-black uppercase text-xs tracking-widest">No signals on the grid.</div>
                        ) : apps.map(app => (
                            <Card
                                key={app.id}
                                onClick={() => setSelectedApp(app)}
                                className={cn(
                                    "p-8 rounded-[2.5rem] bg-white border shadow-sm cursor-pointer transition-all hover:shadow-xl group",
                                    selectedApp?.id === app.id ? "border-primary ring-4 ring-primary/5" : "border-slate-100"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner group-hover:scale-105 transition-transform">
                                            <Store size={28} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-xl font-black uppercase text-foreground leading-tight">{app.business_name}</h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                    app.verification_status === 'Approved' ? "bg-emerald-500 text-white" :
                                                    app.verification_status === 'Pending' ? "bg-amber-500 text-white" : "bg-slate-400 text-white"
                                                )}>{app.verification_status}</span>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.business_type} &bull; {new Date(app.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn("h-6 w-6 text-slate-200 group-hover:text-primary transition-all", selectedApp?.id === app.id && "translate-x-2 text-primary")} />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Intelligence Panel */}
                <div className="lg:col-span-5 space-y-8">
                    {selectedApp ? (
                        <Card className="p-10 rounded-[3rem] bg-white border border-primary/20 shadow-2xl space-y-10 sticky top-24 animate-in slide-in-from-right-10 duration-500 text-left">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">{selectedApp.business_name}</h2>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Intelligence Briefing</p>
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-2xl font-black text-sm shadow-inner",
                                    selectedApp.risk_score < 30 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    Risk: {selectedApp.risk_score}/100
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Estimated GMV</p>
                                    <p className="text-xl font-black text-foreground">{selectedApp.monthly_orders === '5,000+' ? 'KSh 12M+' : 'KSh 1.2M+'}</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">System Logic</p>
                                    <p className="text-xl font-black text-foreground">{selectedApp.current_system}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">Verification Checklist</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Business Identity', checked: true },
                                        { label: 'Owner Credentials', checked: true },
                                        { label: 'Contact Authentication', checked: true },
                                        { label: 'Operational Capacity', checked: false },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                {item.checked ? <CheckCircle2 className="text-emerald-500" size={16} /> : <Clock className="text-amber-500" size={16} />}
                                                <span className="text-[11px] font-bold uppercase tracking-tight text-slate-600">{item.label}</span>
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-slate-300">{item.checked ? 'Verified' : 'Awaiting'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <Button
                                    onClick={() => handleApprove(selectedApp.id)}
                                    disabled={provisioning || selectedApp.verification_status === 'Approved'}
                                    className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
                                >
                                    {provisioning ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
                                    {selectedApp.verification_status === 'Approved' ? 'Organization Provisioned' : 'Authorize & Provision'}
                                </Button>
                                <Button variant="outline" className="w-full h-14 rounded-2xl border-rose-100 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50">Reject Application</Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-[600px] rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-6 opacity-30 text-slate-400">
                            <Zap size={64} />
                            <p className="font-black uppercase tracking-[0.2em] text-xs">Select Signal for Analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
