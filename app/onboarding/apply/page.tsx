'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { onboardingEngine } from '@/lib/apex-os/onboarding-engine';
import MerchantDiscovery from '@/components/onboarding/role-flows/MerchantDiscovery';
import {
    Store,
    CheckCircle2,
    Rocket,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function RetailerApplicationPage() {
    const [submitted, setSubmitted] = React.useState(false);

    const handleComplete = async (data: Record<string, string>) => {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await onboardingEngine.completeStep(session.user.id, 'MERCHANT', 'discovery', 'business-identity', data);
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-12 rounded-[3.5rem] bg-white shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-inner">
                        <CheckCircle2 size={48} className="animate-bounce" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Discovery Complete</h1>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Your operational parameters have been logged. Proceed to the Setup Center to finalize your organization deployment.
                        </p>
                    </div>
                    <Link href="/onboarding">
                        <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20">Enter Setup Center</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Brand Sidebar */}
            <div className="md:w-1/3 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 text-left">
                    <div className="flex items-center gap-3 mb-12">
                        <Store className="h-8 w-8" />
                        <span className="text-2xl font-black uppercase tracking-tighter">Apex OS</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-6">Scale Your Tech Store.</h1>
                    <p className="text-white/80 font-medium text-lg max-w-sm">
                        Synchronize your inventory, riders, and finance in one specialized digital cockpit.
                    </p>
                </div>

                <div className="relative z-10 space-y-6 text-left">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg"><Rocket size={20} /></div>
                        <p className="text-xs font-black uppercase tracking-widest">Instant Market Deployment</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg"><Users size={20} /></div>
                        <p className="text-xs font-black uppercase tracking-widest">Multi-Role Access Control</p>
                    </div>
                </div>

                <Store className="absolute -bottom-20 -right-20 h-96 w-96 text-white/10 rotate-12" />
            </div>

            <div className="flex-1 p-8 md:p-24 flex items-center justify-center">
                <MerchantDiscovery onComplete={handleComplete} />
            </div>
        </div>
    );
}

