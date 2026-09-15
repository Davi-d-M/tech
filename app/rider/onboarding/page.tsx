'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldCheck,
    Phone,
    Truck,
    CheckCircle2,
    Loader2,
    Camera,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { onboardingEngine } from '@/lib/apex-os/onboarding-engine';
import RiderAcademy from '@/components/onboarding/role-flows/RiderAcademy';

const normalizePhone = (p: string) => p.replace(/^\+254/, '').replace(/^0/, '').trim();

export default function RiderOnboarding() {
    const searchParams = useSearchParams();
    const initialStep = searchParams.get('step') || 'welcome';

    const [step, setStep] = useState(initialStep);
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [riderName, setRiderName] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('Motorbike');
    const [riderPhoto, setRiderPhoto] = useState<File | null>(null);
    const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
    const [idFrontPhoto, setIdFrontPhoto] = useState<File | null>(null);
    const [idBackPhoto, setIdBackPhoto] = useState<File | null>(null);
    const [licensePhoto, setLicensePhoto] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (supabase) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) setUser(session.user);
            });
        }
    }, []);

    const advance = async (nextStep: string, metadata = {}) => {
        if (user) {
            await onboardingEngine.completeStep(user.id, 'RIDER', step, nextStep, metadata);
        }
        setStep(nextStep);
    };

    const handleIdentify = async () => {
        const normalized = normalizePhone(phone);
        if (normalized.length < 9) {
            setError("Valid mobile number required (e.g. 07XXXXXXXX)");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            if (!supabase) throw new Error("Offline");
            const { data } = await supabase.from('rider_status').select('rider_phone').eq('rider_phone', normalized).maybeSingle();
            if (data) {
                setError("Unit already active on the grid. Access denied.");
                setLoading(false);
                return;
            }

            await advance('identity', { phone: normalized });
            setLoading(false);
        } catch {
            setStep('identity');
            setLoading(false);
        }
    };

    const handleVerificationSubmit = async () => {
        if (!riderPhoto || !vehiclePhoto || !idFrontPhoto || !idBackPhoto || !licensePhoto) {
            setError("All document photos are required for verification");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            if (!supabase) return;
            const normalized = normalizePhone(phone);
            const BUCKET = 'rider-verifications';
            const currentSupabase = supabase;

            const uploadTask = async (file: File, suffix: string) => {
                const path = `riders/${normalized}-${Date.now()}-${suffix}`;
                const { error } = await currentSupabase.storage.from(BUCKET).upload(path, file);
                if (error) throw error;
                const { data } = currentSupabase.storage.from(BUCKET).getPublicUrl(path);
                return data.publicUrl;
            };

            const [riderUrl, vehicleUrl, idFrontUrl, idBackUrl, licenseUrl] = await Promise.all([
                uploadTask(riderPhoto, 'selfie'),
                uploadTask(vehiclePhoto, 'vehicle'),
                uploadTask(idFrontPhoto, 'id-front'),
                uploadTask(idBackPhoto, 'id-back'),
                uploadTask(licensePhoto, 'license')
            ]);

            const riderData = {
                rider_phone: normalized || user?.user_metadata?.phone_number,
                rider_name: riderName.trim(),
                pin: '1234',
                id_number: idNumber,
                license_number: licenseNumber,
                plate_number: plateNumber,
                vehicle_type: vehicleType,
                rider_photo_url: riderUrl,
                vehicle_photo_url: vehicleUrl,
                id_photo_front_url: idFrontUrl,
                id_photo_back_url: idBackUrl,
                license_photo_url: licenseUrl,
                verification_status: 'Pending'
            };

            await currentSupabase.from('rider_status').upsert(riderData, { onConflict: 'rider_phone' });
            await advance('agreement');
        } catch (err: unknown) {
            setError((err as Error).message || "Verification upload failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 lg:p-6 selection:bg-primary/20">
            <div className="max-w-md w-full space-y-8 lg:y-12 animate-in fade-in duration-700">

                <div className="text-center space-y-3 lg:space-y-4">
                    <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-3xl lg:rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-sm">
                        <Truck className="h-8 w-8 lg:h-10 lg:w-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-foreground leading-none">Fleet <span className="text-primary italic">Onboarding</span></h1>
                        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 lg:mt-2">Node Activation Flow</p>
                    </div>
                </div>

                <div className="relative">
                    {step === 'welcome' && (
                        <Card className="p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl text-center space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-foreground uppercase">Rider Academy</h2>
                                <p className="text-sm text-slate-500 font-medium italic">&quot;Prepare for the city grid. Learn the Apex operational standards.&quot;</p>
                            </div>
                            <RiderAcademy onComplete={() => advance('phone')} />
                        </Card>
                    )}

                    {step === 'phone' && (
                        <Card className="p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl space-y-8 animate-in slide-in-from-right-4">
                            <div className="space-y-1.5 text-left">
                                <h3 className="text-lg lg:text-xl font-black text-foreground uppercase">Telecom Link</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identify your mobile node</p>
                            </div>
                            <div className="relative">
                                <Input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="07XXXXXXXX"
                                    className="h-14 lg:h-16 rounded-xl lg:rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-black"
                                />
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                            {error && <p className="text-[9px] font-black text-rose-500 uppercase">{error}</p>}
                            <Button onClick={handleIdentify} disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                                {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Verify Node"}
                            </Button>
                        </Card>
                    )}

                    {step === 'identity' && (
                        <Card className="p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl space-y-8 animate-in slide-in-from-right-4">
                            <div className="space-y-1.5 text-left">
                                <h3 className="text-lg lg:text-xl font-black text-foreground uppercase">Identity Profile</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Log credentials to the grid</p>
                            </div>
                            <div className="space-y-4">
                                <Input value={riderName} onChange={e => setRiderName(e.target.value)} placeholder="Full Name" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" />
                                <Input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="National ID" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" />
                                <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="License Number" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                            <Button onClick={() => advance('vehicle')} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest">Continue to Vehicle</Button>
                        </Card>
                    )}

                    {step === 'vehicle' && (
                        <Card className="p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl space-y-8 animate-in slide-in-from-right-4">
                             <div className="space-y-1.5 text-left">
                                <h3 className="text-lg lg:text-xl font-black text-foreground uppercase">Vehicle Specs</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select your transport mode</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {['Motorbike', 'Car', 'Bicycle', 'Van'].map(v => (
                                    <button key={v} onClick={() => setVehicleType(v)} className={cn("p-6 rounded-3xl border-2 transition-all", vehicleType === v ? "border-primary bg-primary/5 shadow-lg" : "bg-slate-50 border-slate-50")}>
                                        <p className="font-black uppercase text-[10px]">{v}</p>
                                    </button>
                                ))}
                            </div>
                            <Input value={plateNumber} onChange={e => setPlateNumber(e.target.value.toUpperCase())} placeholder="Plate Number" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black" />
                            <Button onClick={() => advance('verification')} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest">Continue to Documents</Button>
                        </Card>
                    )}

                    {step === 'verification' && (
                        <Card className="p-10 rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl space-y-8 animate-in slide-in-from-right-4">
                            <div className="space-y-1.5 text-left">
                                <h3 className="text-lg lg:text-xl font-black text-foreground uppercase">Document Upload</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capture tactical visuals</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Selfie', state: riderPhoto, set: setRiderPhoto },
                                    { label: 'Vehicle', state: vehiclePhoto, set: setVehiclePhoto },
                                    { label: 'ID Front', state: idFrontPhoto, set: setIdFrontPhoto },
                                    { label: 'ID Back', state: idBackPhoto, set: setIdBackPhoto },
                                ].map(doc => (
                                    <label key={doc.label} className="flex flex-col items-center gap-2 p-6 rounded-3xl border-2 border-dashed bg-slate-50 cursor-pointer hover:border-primary transition-all">
                                        <input type="file" accept="image/*" onChange={e => doc.set(e.target.files?.[0] || null)} className="hidden" />
                                        <Camera className={cn("h-6 w-6", doc.state ? "text-primary" : "text-slate-300")} />
                                        <span className="text-[8px] font-black uppercase">{doc.label}</span>
                                    </label>
                                ))}
                            </div>
                            <label className="flex flex-col items-center gap-2 p-6 rounded-3xl border-2 border-dashed bg-slate-50 cursor-pointer hover:border-primary transition-all w-full">
                                <input type="file" accept="image/*" onChange={e => setLicensePhoto(e.target.files?.[0] || null)} className="hidden" />
                                <CreditCard className={cn("h-6 w-6", licensePhoto ? "text-primary" : "text-slate-300")} />
                                <span className="text-[8px] font-black uppercase">Driving License</span>
                            </label>
                            {error && <p className="text-[9px] font-black text-rose-500 uppercase">{error}</p>}
                            <Button onClick={handleVerificationSubmit} disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                                {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Initiate Verification"}
                            </Button>
                        </Card>
                    )}

                    {(step === 'agreement' || step === 'biometrics' || step === 'pending' || step === 'success') && (
                        <div className="animate-in fade-in duration-500 text-center space-y-6">
                            <CheckCircle2 size={48} className="mx-auto text-emerald-500 animate-bounce" />
                            <h2 className="text-2xl font-black uppercase">Mission Parameters Set</h2>
                            <p className="text-slate-500 font-medium italic">Proceeding to final activation in Setup Center...</p>
                            <Link href="/onboarding">
                                <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest">Enter Setup Center</Button>
                            </Link>
                        </div>
                    )}
                </div>

                <div className="text-center flex items-center justify-center gap-2 opacity-30">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Apex Onboarding OS v2.0</p>
                </div>
            </div>
        </div>
    );
}
