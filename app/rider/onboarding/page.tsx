'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Truck,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    Fingerprint,
    Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { registerBiometrics } from '@/lib/biometricService';
import Link from 'next/link';

type Step = 'welcome' | 'phone' | 'otp' | 'biometrics' | 'success';

export default function RiderOnboarding() {
    const [step, setStep] = useState<Step>('welcome');
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);

    const handleSendOTP = async () => {
        if (phone.length < 10) {
            setError("Valid phone number required");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Real OTP Send logic with Supabase Auth
            if (supabase) {
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    phone: phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`
                });
                if (otpError) throw otpError;
                setStep('otp');
            }
        } catch (err: any) {
            setError(err.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.join('').length < 6) {
            setError("Complete the 6-digit code");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Real OTP Verify logic with Supabase Auth
            if (supabase) {
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    phone: phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`,
                    token: otp.join(''),
                    type: 'sms'
                });
                if (verifyError) throw verifyError;
                setStep('biometrics');
            }
        } catch (err: any) {
            setError(err.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricEnroll = async () => {
        setLoading(true);
        setError(null);
        try {
            const cred = await registerBiometrics(phone);
            if (cred) {
                // Save credential to Supabase rider_status
                if (supabase) {
                    await supabase.from('rider_status').update({ biometric_key: cred }).eq('rider_phone', phone);
                }
            }
            setStep('success');
        } catch {
            setError("Biometric setup failed. You can skip for now.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 selection:bg-primary/20">
            <div className="max-w-md w-full space-y-12 animate-in fade-in duration-700">

                {/* 🛡️ TECHPAX BRANDING */}
                <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-sm">
                        <Truck className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">TechPax <span className="text-primary italic">Driver</span></h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Move • Deliver • Earn</p>
                    </div>
                </div>

                {/* 🚀 PROGRESSIVE FLOW */}
                <Card className="p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-10">

                        {step === 'welcome' && (
                            <div className="space-y-8 text-center animate-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-foreground uppercase leading-tight">Welcome to <br/> the Fleet</h2>
                                    <p className="text-sm text-slate-500 font-medium italic">&quot;Trusted by thousands of riders. Start your tactical mission today.&quot;</p>
                                </div>
                                <Button onClick={() => setStep('phone')} className="w-full h-18 rounded-[1.8rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                    Continue to Login
                                </Button>
                            </div>
                        )}

                        {step === 'phone' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 text-left">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase">Identity Link</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter Mobile Number</p>
                                </div>
                                <div className="relative">
                                    <Input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+254 7XX XXX XXX"
                                        className="h-16 rounded-2xl bg-slate-50 border-slate-100 pl-14 text-sm font-black"
                                    />
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                </div>
                                <Button onClick={handleSendOTP} disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify Identity"}
                                </Button>
                            </div>
                        )}

                        {step === 'otp' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 text-center">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase">Verification</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sent to {phone}</p>
                                </div>
                                <div className="flex justify-between gap-2">
                                    {otp.map((digit, i) => (
                                        <Input
                                            key={i}
                                            id={`otp-${i}`}
                                            value={digit}
                                            onChange={e => {
                                                const val = e.target.value.slice(-1);
                                                const newOtp = [...otp];
                                                newOtp[i] = val;
                                                setOtp(newOtp);
                                                if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
                                            }}
                                            maxLength={1}
                                            className="h-14 w-12 text-center rounded-xl bg-slate-50 border-slate-100 font-black text-lg p-0 focus:ring-2 focus:ring-primary/20"
                                        />
                                    ))}
                                </div>
                                {error && <p className="text-[10px] font-black text-rose-500 uppercase">{error}</p>}
                                <Button onClick={handleVerifyOTP} disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify Code"}
                                </Button>
                            </div>
                        )}

                        {step === 'biometrics' && (
                            <div className="space-y-8 text-center animate-in slide-in-from-bottom-4 duration-500">
                                <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto">
                                    <Fingerprint className="h-12 w-12 animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-foreground uppercase">Bio-Lock</h2>
                                    <p className="text-sm text-slate-500 font-medium italic">&quot;Enable fingerprint or Face ID for zero-delay future logins.&quot;</p>
                                </div>
                                <div className="space-y-3">
                                    <Button onClick={handleBiometricEnroll} disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                                        Enable Biometrics
                                    </Button>
                                    <Button variant="ghost" onClick={() => setStep('success')} className="w-full text-slate-400 font-black uppercase text-[10px]">Maybe Later</Button>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="space-y-8 text-center animate-in zoom-in-95 duration-700">
                                <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                                    <CheckCircle2 className="h-12 w-12" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-foreground uppercase">Grid Online</h2>
                                    <p className="text-sm text-slate-500 font-medium italic">&quot;Tactical link established. Welcome to TechPax Logistics, bro.&quot;</p>
                                </div>
                                <Link href="/rider/dashboard" className="block">
                                    <Button className="w-full h-18 rounded-[1.8rem] bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20">
                                        Enter Dashboard
                                    </Button>
                                </Link>
                            </div>
                        )}

                    </div>
                    {/* Background Pattern */}
                    <Truck className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-12 -z-0" />
                </Card>

                <div className="text-center flex items-center justify-center gap-2 opacity-30">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Secured by TechPax Protocol v4.0</p>
                </div>

            </div>
        </div>
    );
}
