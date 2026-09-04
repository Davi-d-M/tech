'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck,
    Loader2,
    Users,
    Camera as Instagram,
    MessageCircle,
    Music,
    Globe,
    ArrowLeft,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function AffiliateApplication() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'existing'>('loading');
    const [form, setForm] = useState({
        promo_name: '',
        instagram: '',
        tiktok: '',
        whatsapp: '',
        bio: ''
    });

    useEffect(() => {
        async function checkStatus() {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth?mode=signin&redirect=/affiliate/apply');
                return;
            }

            const { data: existing } = await supabase
                .from('affiliate_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (existing) {
                setStatus('existing');
                setTimeout(() => router.push('/affiliate/dashboard'), 2000);
            } else {
                setStatus('form');
            }
        }
        checkStatus();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            if (!session) return;

            const { error } = await supabase!
                .from('affiliate_profiles')
                .insert([{
                    user_id: session.user.id,
                    promo_name: form.promo_name.trim().toLowerCase(),
                    social_handles: {
                        instagram: form.instagram,
                        tiktok: form.tiktok,
                        whatsapp: form.whatsapp
                    },
                    bio: form.bio,
                    status: 'Pending'
                }]);

            if (error) throw error;

            setStatus('success');
        } catch (err: unknown) {
            const error = err as Error;
            alert(error.message || "Application failed. Promotional name might be taken.");
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;

    if (status === 'existing') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 shadow-inner"><Check size={40} /></div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Already a Partner</h1>
            <p className="text-slate-500 mt-2">Redirecting to your dashboard...</p>
        </div>
    );

    if (status === 'success') return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <Card className="max-w-md w-full p-12 rounded-[3.5rem] bg-white shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95">
                <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner animate-pulse">
                    <ShieldCheck size={48} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Application Logged</h2>
                    <p className="text-slate-500 font-medium leading-relaxed italic">
                        &quot;Your partnership credentials have been established. Our team will review your social reach and activate your dashboard within 24 hours.&quot;
                    </p>
                </div>
                <Link href="/profile">
                    <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                        Return to Profile
                    </Button>
                </Link>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 text-left selection:bg-primary/20">
            <div className="max-w-2xl mx-auto space-y-12">
                <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                    <ArrowLeft size={14} /> Back to Profile
                </Link>

                <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto shadow-sm border border-indigo-100">
                        <Users className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-none">Apex <span className="text-primary italic">Affiliate</span></h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Promote • Earn • Scale</p>
                    </div>
                </div>

                <Card className="p-10 lg:p-16 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Promoter Identity</h2>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Promotional Name (Unique)</label>
                                <div className="relative">
                                    <Input
                                        value={form.promo_name}
                                        onChange={e => setForm({...form, promo_name: e.target.value.replace(/[^a-zA-Z0-9]/g, '')})}
                                        placeholder="e.g. tech_guru_ke"
                                        className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 font-black text-lg text-primary"
                                        required
                                    />
                                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">This will be part of your link: apexstores.ke/ref/{form.promo_name || 'NAME'}</p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Instagram Handle</label>
                                    <div className="relative">
                                        <Input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="@username" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold" />
                                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">TikTok Handle</label>
                                    <div className="relative">
                                        <Input value={form.tiktok} onChange={e => setForm({...form, tiktok: e.target.value})} placeholder="@username" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold" />
                                        <Music className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp Business Number</label>
                                <div className="relative">
                                    <Input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="07XXXXXXXX" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold" />
                                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Promotional Strategy (Short Bio)</label>
                                <Textarea
                                    value={form.bio}
                                    onChange={e => setForm({...form, bio: e.target.value})}
                                    placeholder="How do you plan to promote our products?"
                                    className="min-h-[120px] rounded-[2rem] bg-slate-50 border-slate-100 p-6 text-sm font-medium italic"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <Button
                                type="submit"
                                disabled={loading || !form.promo_name}
                                className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Deploy Application"}
                            </Button>
                        </div>
                    </form>

                    <Users className="absolute -bottom-10 -right-10 h-64 w-64 text-indigo-500/5 rotate-12 -z-0" />
                </Card>
            </div>
        </div>
    );
}
