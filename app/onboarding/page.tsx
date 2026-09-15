'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { onboardingEngine, OnboardingState, OnboardingRole } from '@/lib/apex-os/onboarding-engine';
import SetupCenter from '@/components/onboarding/SetupCenter';
import CustomerOnboarding from '@/components/onboarding/role-flows/CustomerOnboarding';
import RiderAcademy from '@/components/onboarding/role-flows/RiderAcademy';
import RiderTestMission from '@/components/onboarding/role-flows/RiderTestMission';
import MerchantDiscovery from '@/components/onboarding/role-flows/MerchantDiscovery';
import TeamProvisioning from '@/components/onboarding/role-flows/TeamProvisioning';
import AffiliateBootcamp from '@/components/onboarding/role-flows/AffiliateBootcamp';
import {
    Loader2,
    Smartphone,
    Users,
    Store,
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function OnboardingRouter() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [user, setUser] = React.useState<any>(null);
    const [onboardingState, setOnboardingState] = React.useState<OnboardingState | null>(null);
    const [needsRoleSelection, setNeedsRoleSelection] = React.useState(false);
    const [view, setView] = React.useState<'ROUTER' | 'SETUP_CENTER' | 'MISSION'>('ROUTER');

    const initializeOnboarding = React.useCallback(async (userId: string, userEmail: string | undefined, forceRole?: OnboardingRole) => {
        setLoading(true);
        try {
            // 1. Detect Role if not forced
            let role: OnboardingRole | null = forceRole || null;

            if (!forceRole) {
                const { data: profile } = await supabase!.from('profiles').select('*').eq('id', userId).single();
                const { data: rider } = await supabase!.from('rider_status').select('rider_phone').eq('rider_phone', profile?.phone_number || '').maybeSingle();
                const { data: supplier } = await supabase!.from('suppliers').select('email').eq('email', userEmail || '').maybeSingle();
                const { data: affiliate } = await supabase!.from('affiliate_profiles').select('id').eq('user_id', userId).maybeSingle();

                if (rider) role = 'RIDER';
                else if (supplier) role = 'MERCHANT';
                else if (affiliate) role = 'AFFILIATE';
                else if (profile?.can_see_partner_offers) {
                    setNeedsRoleSelection(true);
                    return;
                } else {
                    role = 'CUSTOMER';
                }
            }

            if (role) {
                const state = await onboardingEngine.getProgress(userId, role);
                setOnboardingState(state);
                // Decide view: If just initialized and score is 0, start mission. Else Setup Center.
                if (state?.score === 0 || state?.currentStep !== 'welcome') setView('MISSION');
                else setView('SETUP_CENTER');
            }
        } catch (err) {
            console.error("Onboarding Router Failure:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push('/auth?mode=signup');
                return;
            }
            setUser(session.user);
            initializeOnboarding(session.user.id, session.user.email);
        });
    }, [initializeOnboarding, router]);

    const handleStepComplete = async (nextStep: string, metadata = {}) => {
        if (!user || !onboardingState) return;
        await onboardingEngine.completeStep(user.id, onboardingState.role, onboardingState.currentStep, nextStep, metadata);

        // Refresh state
        const newState = await onboardingEngine.getProgress(user.id, onboardingState.role);
        setOnboardingState(newState);

        if (newState?.isCompleted) {
            router.push(onboardingState.role === 'RIDER' ? '/rider/dashboard' : onboardingState.role === 'MERCHANT' ? '/supplier' : '/');
        } else {
            setView('SETUP_CENTER');
        }
    };

    const handleRoleSelect = (role: OnboardingRole) => {
        setNeedsRoleSelection(false);
        initializeOnboarding(user.id, role);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Synchronizing Neural Grid...</p>
        </div>
    );

    if (needsRoleSelection) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
            <div className="max-w-4xl w-full space-y-12">
                <header className="text-center space-y-4">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Choose Your Path</h1>
                    <p className="text-slate-500 font-medium italic">Every node in the Apex ecosystem has a specialized onboarding mission.</p>
                </header>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { id: 'CUSTOMER' as OnboardingRole, label: 'Customer', icon: Smartphone, desc: 'Browse the catalog and track high-speed tech deliveries.' },
                        { id: 'RIDER' as OnboardingRole, label: 'Rider Partner', icon: Users, desc: 'Earn by accepting delivery missions across the city grid.' },
                        { id: 'MERCHANT' as OnboardingRole, label: 'Merchant / Partner', icon: Store, desc: 'Control your inventory and logistics with Apex OS.' },
                    ].map(role => (
                        <Card
                            key={role.id}
                            onClick={() => handleRoleSelect(role.id)}
                            className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-primary/20 hover:shadow-2xl transition-all cursor-pointer group"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all mb-8 shadow-inner">
                                <role.icon size={28} />
                            </div>
                            <h3 className="text-xl font-black uppercase text-foreground leading-none mb-3">{role.label}</h3>
                            <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">{role.desc}</p>
                            <div className="mt-8 flex justify-end">
                                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all">Start Protocol <ArrowRight size={14} className="ml-2" /></Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );

    if (view === 'SETUP_CENTER' && onboardingState) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <SetupCenter
                    state={onboardingState}
                    onContinue={() => setView('MISSION')}
                />
            </div>
        );
    }

    if (view === 'MISSION' && onboardingState) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                {onboardingState.role === 'CUSTOMER' && (
                    <CustomerOnboarding onComplete={(data) => handleStepComplete('preferences', data)} />
                )}
                {onboardingState.role === 'RIDER' && (
                    <>
                        {onboardingState.currentStep === 'welcome' && (
                            <RiderAcademy onComplete={() => handleStepComplete('welcome')} />
                        )}
                        {onboardingState.currentStep === 'test-mission' && (
                            <RiderTestMission onComplete={() => handleStepComplete('test-mission')} />
                        )}
                        {['phone', 'identity', 'vehicle', 'verification', 'agreement', 'biometrics', 'pending'].includes(onboardingState.currentStep) && (
                            <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 text-center space-y-6">
                                <h3 className="text-xl font-black uppercase">Switching to Device Node...</h3>
                                <p className="text-sm text-slate-500 italic">Please complete your identity verification in the Fleet Dashboard.</p>
                                <Button onClick={() => router.push('/rider/onboarding')} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase">Open Fleet Setup</Button>
                            </Card>
                        )}
                    </>
                )}
                {onboardingState.role === 'MERCHANT' && (
                    <>
                        {onboardingState.currentStep === 'welcome' && (
                            <MerchantDiscovery onComplete={(data) => handleStepComplete('discovery', data)} />
                        )}
                        {onboardingState.currentStep === 'team' && (
                            <TeamProvisioning tenantId={user?.id || 'master'} onComplete={() => handleStepComplete('team')} />
                        )}
                        {['business', 'categories', 'payout', 'agreement', 'pending'].includes(onboardingState.currentStep) && (
                            <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 text-center space-y-6">
                                <h3 className="text-xl font-black uppercase">Initializing Merchant Node...</h3>
                                <p className="text-sm text-slate-500 italic">Please finalize your business profile to activate the dashboard.</p>
                                <Button onClick={() => router.push('/supplier/onboarding')} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase">Open Partner Setup</Button>
                            </Card>
                        )}
                    </>
                )}
                {onboardingState.role === 'AFFILIATE' && (
                    <AffiliateBootcamp onComplete={() => handleStepComplete('complete')} />
                )}
            </div>
        );
    }

    return null;
}
