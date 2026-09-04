'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ShieldCheck,
    Fingerprint,
    Phone,
    User,
    CreditCard,
    Camera,
    Truck,
    CheckCircle2,
    Loader2,
    Zap,
    Bike,
    Car,
    Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { registerBiometrics } from '@/lib/biometricService';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Step = 'welcome' | 'phone' | 'identity' | 'vehicle' | 'verification' | 'agreement' | 'biometrics' | 'pending' | 'success';

const normalizePhone = (p: string) => p.replace(/^\+254/, '').replace(/^0/, '').trim();

export default function RiderOnboarding() {
    const [step, setStep] = useState<Step>('welcome');
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
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [pin, setPin] = useState('1234');
    const [error, setError] = useState<string | null>(null);

    const handleDownloadAgreement = async () => {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = pageWidth - (margin * 2);
        let y = 20;

        const addText = (text: string, isBold = false) => {
            doc.setFont("helvetica", isBold ? "bold" : "normal");
            const lines = doc.splitTextToSize(text, textWidth);
            if (y + (lines.length * 7) > 280) { doc.addPage(); y = 20; }
            doc.text(lines, margin, y);
            y += (lines.length * 7) + 5;
        };

        doc.setFontSize(14);
        addText("DRIVER PARTNER & TRANSPORT NETWORK SERVICES AGREEMENT", true);
        doc.setFontSize(10);
        addText("1. PURPOSE: The Company operates a digital transport network platform connecting passengers with drivers.");
        addText("2. INDEPENDENT CONTRACTOR: The Driver is an independent contractor, not an employee.");
        addText("3. ELIGIBILITY: Driver must provide valid ID, License, and PSV badge.");
        addText("4. VEHICLE: Vehicle must be mechanically safe, insured, and presentable.");
        addText("5. CONDUCT: Driver shall drive safely, treat passengers respectfully, and avoid fraud.");
        addText("6. FARES: Calculated by the platform. Independent management of availability.");
        addText("7. PRIVACY: Comply with data protection laws. Use data only for service.");
        addText("8. TERMINATION: Either party may terminate with notice.");
        addText("9. DISPUTES: Governed by the laws of Kenya.");

        doc.save("TechPax_Driver_Agreement.pdf");
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
            // CHECK IF PHONE ALREADY ON GRID
            const { data } = await supabase.from('rider_status').select('rider_phone').eq('rider_phone', normalized).maybeSingle();
            if (data) {
                setError("Unit already active on the grid. Access denied.");
                setLoading(false);
                return;
            }

            setStep('identity');
            setLoading(false);
        } catch {
            setStep('identity');
            setLoading(false);
        }
    };

    const handleBiometricEnroll = async () => {
        setLoading(true);
        setError(null);
        try {
            const normalized = normalizePhone(phone);
            const cred = await registerBiometrics(normalized);
            if (cred) {
                // Save credential to Supabase rider_status
                if (supabase) {
                    await supabase.from('rider_status').update({ biometric_key: cred }).eq('rider_phone', normalized);
                }
            }

            // Check current status - usually pending for new users
            if (supabase) {
                const { data } = await supabase.from('rider_status').select('verification_status').eq('rider_phone', normalized).maybeSingle();
                if (data?.verification_status === 'Verified') {
                    setStep('success');
                } else {
                    setStep('pending');
                }
            } else {
                setStep('pending');
            }
        } catch {
            setStep('pending');
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationSubmit = async () => {
        if (!riderPhoto || !vehiclePhoto || !idFrontPhoto || !idBackPhoto || !licensePhoto) {
            setError("All document photos are required for verification");
            return;
        }
        if (!riderName.trim()) {
            setError("Full Name is required");
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

            // Update Rider Status with new info
            const riderData = {
                rider_phone: normalized,
                rider_name: riderName.trim(),
                pin: '1234', // Temporary default pin
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

            const { error: updateError } = await currentSupabase
                .from('rider_status')
                .upsert(riderData, { onConflict: 'rider_phone' });

            if (updateError) {
                console.warn("Primary upsert failed, attempting schema-resilient fallback...", updateError);

                // Tier 2: Minimal Identity
                const tier2Data = {
                    rider_phone: normalized,
                    rider_name: riderName.trim(),
                    pin: '1234',
                    vehicle_type: vehicleType,
                    verification_status: 'Pending'
                };

                const { error: tier2Error } = await currentSupabase
                    .from('rider_status')
                    .upsert(tier2Data, { onConflict: 'rider_phone' });

                if (tier2Error) {
                    const { error: tier3Error } = await currentSupabase
                        .from('rider_status')
                        .upsert({
                            rider_phone: normalized,
                            rider_name: riderName.trim(),
                            pin: '1234'
                        }, { onConflict: 'rider_phone' });

                    if (tier3Error) throw tier3Error;
                }
            }
            setStep('agreement');
        } catch (err: unknown) {
            setError((err as Error).message || "Verification upload failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 lg:p-6 selection:bg-primary/20">
            <div className="max-w-md w-full space-y-8 lg:space-y-12 animate-in fade-in duration-700">

                {/* 🛡️ TECHPAX BRANDING */}
                <div className="text-center space-y-3 lg:space-y-4">
                    <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-3xl lg:rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-sm">
                        <Truck className="h-8 w-8 lg:h-10 lg:w-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-foreground leading-none">TechPax <span className="text-primary italic">Driver</span></h1>
                        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] lg:tracking-[0.3em] mt-1.5 lg:mt-2">Move • Deliver • Earn</p>
                    </div>

                    {/* Visual Progress Stepper */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {[
                            { id: 'welcome', label: 'Start' },
                            { id: 'phone', label: 'Identity' },
                            { id: 'identity', label: 'Docs' },
                            { id: 'vehicle', label: 'Specs' },
                            { id: 'verification', label: 'Check' },
                            { id: 'agreement', label: 'Legal' },
                            { id: 'pending', label: 'Review' }
                        ].map((s, i, arr) => (
                            <div key={s.id} className="flex items-center">
                                <div className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    step === s.id ? "w-8 bg-primary shadow-lg shadow-primary/20" :
                                    arr.findIndex(x => x.id === step) > i ? "w-4 bg-emerald-500" : "w-2 bg-slate-100"
                                )} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🚀 PROGRESSIVE FLOW */}
                <Card className="p-6 lg:p-10 rounded-3xl lg:rounded-[3.5rem] bg-white border-2 border-slate-50 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-8 lg:space-y-10">

                        {step === 'welcome' && (
                            <div className="space-y-6 lg:space-y-8 text-center animate-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <h2 className="text-xl lg:text-2xl font-black text-foreground uppercase leading-tight">Welcome to <br/> the Fleet</h2>
                                    <p className="text-xs lg:text-sm text-slate-500 font-medium italic">&quot;Trusted by thousands of riders. Start your tactical mission today.&quot;</p>
                                </div>
                                <Button onClick={() => setStep('phone')} className="w-full h-14 lg:h-18 rounded-2xl lg:rounded-[1.8rem] bg-primary text-white font-black uppercase text-[10px] lg:text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                    Continue to Login Protocol
                                </Button>
                            </div>
                        )}

                        {step === 'phone' && (
                            <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500 text-left">
                                <div className="space-y-1.5 lg:space-y-2">
                                    <h3 className="text-lg lg:text-xl font-black text-foreground uppercase">Identity Link</h3>
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter Mobile Number</p>
                                </div>
                                <div className="relative">
                                    <Input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+254 7XX XXX XXX"
                                        className="h-14 lg:h-16 rounded-xl lg:rounded-2xl bg-slate-50 border-slate-100 pl-12 lg:pl-14 text-sm font-black"
                                    />
                                    <Phone className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-slate-300" />
                                </div>
                                {error && <p className="text-[9px] lg:text-[10px] font-black text-rose-500 uppercase animate-pulse">{error}</p>}
                                <Button onClick={handleIdentify} disabled={loading} className="w-full h-14 lg:h-16 rounded-xl lg:rounded-2xl bg-primary text-white font-black uppercase text-[10px] lg:text-xs tracking-widest active:scale-95 transition-all">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify Identity"}
                                </Button>
                            </div>
                        )}

                        {step === 'identity' && (
                            <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500 text-left">
                                <div className="space-y-1.5 lg:space-y-2">
                                    <h3 className="text-lg lg:text-xl font-black text-foreground uppercase">Identity Profile</h3>
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Documents & Credentials</p>
                                </div>
                                <div className="space-y-3 lg:space-y-4">
                                    <div className="relative">
                                        <Input value={riderName} onChange={e => setRiderName(e.target.value)} placeholder="Full Name" className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-slate-50 border-slate-100 pl-11 lg:pl-12 font-bold text-sm" />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-slate-300" />
                                    </div>
                                    <div className="relative">
                                        <Input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="National ID Number" className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-slate-50 border-slate-100 pl-11 lg:pl-12 font-bold text-sm" />
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-slate-300" />
                                    </div>
                                    <div className="relative">
                                        <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="Driver's License No." className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-slate-50 border-slate-100 pl-11 lg:pl-12 font-bold text-sm" />
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-slate-300" />
                                    </div>
                                </div>
                                <Button
                                    onClick={async () => {
                                        if (!riderName.trim() || idNumber.length < 6 || licenseNumber.length < 6) {
                                            setError("Name and valid ID/License credentials required.");
                                            return;
                                        }
                                        if (!/^[a-zA-Z0-9]+$/.test(idNumber) || !/^[a-zA-Z0-9]+$/.test(licenseNumber)) {
                                            setError("Invalid characters in ID or License Number.");
                                            return;
                                        }

                                        setLoading(true);
                                        setError(null);
                                        try {
                                            if (!supabase) throw new Error("Offline");

                                            // Check for duplicate ID or License
                                            const { data: existingRider } = await supabase
                                                .from('rider_status')
                                                .select('rider_phone')
                                                .or(`id_number.eq.${idNumber},license_number.eq.${licenseNumber}`)
                                                .maybeSingle();

                                            if (existingRider) {
                                                setError("Tactical Collision: ID or License number already registered.");
                                                setLoading(false);
                                                return;
                                            }

                                            setStep('vehicle');
                                        } catch {
                                            setStep('vehicle'); // Fallback
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full h-14 lg:h-16 rounded-xl lg:rounded-2xl bg-primary text-white font-black uppercase text-[10px] lg:text-xs tracking-widest active:scale-95 transition-all"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Continue to Vehicle"}
                                </Button>
                            </div>
                        )}

                        {step === 'vehicle' && (
                            <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500 text-left">
                                <div className="space-y-1.5 lg:space-y-2">
                                    <h3 className="text-lg lg:text-xl font-black text-foreground uppercase">Logistics Specs</h3>
                                    <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Details</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'Motorbike', icon: Bike },
                                            { id: 'Car', icon: Car },
                                            { id: 'Bicycle', icon: Navigation },
                                            { id: 'Van', icon: Truck },
                                        ].map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setVehicleType(v.id)}
                                                className={cn(
                                                    "p-6 rounded-3xl border-2 text-left transition-all duration-300 group",
                                                    vehicleType === v.id ? "border-primary bg-primary/5 shadow-lg scale-105" : "border-slate-50 bg-slate-50/30 opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <v.icon className={cn("h-6 w-6 mb-3 transition-colors", vehicleType === v.id ? "text-primary" : "text-slate-300 group-hover:text-primary")} />
                                                <p className="font-black uppercase tracking-tight text-[10px] text-foreground">{v.id}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <Input value={plateNumber} onChange={e => setPlateNumber(e.target.value.toUpperCase())} placeholder="Plate Number (KXX 000X)" className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-11 lg:pl-12 font-black text-sm" />
                                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    </div>
                                </div>
                                <Button onClick={() => setStep('verification')} className="w-full h-14 lg:h-16 rounded-xl lg:rounded-2xl bg-primary text-white font-black uppercase text-[10px] lg:text-xs tracking-widest active:scale-95 transition-all">
                                    Continue to Verification
                                </Button>
                            </div>
                        )}

                        {step === 'verification' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 text-left">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase">Verification</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Visuals & Documents</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col items-center gap-2 p-6 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 cursor-pointer hover:border-primary transition-all">
                                        <input type="file" accept="image/*" onChange={e => setRiderPhoto(e.target.files?.[0] || null)} className="hidden" />
                                        <Camera className={cn("h-6 w-6", riderPhoto ? "text-primary" : "text-slate-300")} />
                                        <span className="text-[8px] font-black uppercase">{riderPhoto ? 'Selfie Captured' : 'Rider Selfie'}</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-6 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 cursor-pointer hover:border-primary transition-all">
                                        <input type="file" accept="image/*" onChange={e => setVehiclePhoto(e.target.files?.[0] || null)} className="hidden" />
                                        <Truck className={cn("h-6 w-6", vehiclePhoto ? "text-primary" : "text-slate-300")} />
                                        <span className="text-[8px] font-black uppercase">{vehiclePhoto ? 'Vehicle Logged' : 'Vehicle Photo'}</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-6 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 cursor-pointer hover:border-primary transition-all">
                                        <input type="file" accept="image/*" onChange={e => setIdFrontPhoto(e.target.files?.[0] || null)} className="hidden" />
                                        <CreditCard className={cn("h-6 w-6", idFrontPhoto ? "text-primary" : "text-slate-300")} />
                                        <span className="text-[8px] font-black uppercase">{idFrontPhoto ? 'ID Front Logged' : 'ID Front'}</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-6 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 cursor-pointer hover:border-primary transition-all">
                                        <input type="file" accept="image/*" onChange={e => setIdBackPhoto(e.target.files?.[0] || null)} className="hidden" />
                                        <CreditCard className={cn("h-6 w-6", idBackPhoto ? "text-primary" : "text-slate-300")} />
                                        <span className="text-[8px] font-black uppercase">{idBackPhoto ? 'ID Back Logged' : 'ID Back'}</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-6 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50 cursor-pointer hover:border-primary transition-all col-span-2">
                                        <input type="file" accept="image/*" onChange={e => setLicensePhoto(e.target.files?.[0] || null)} className="hidden" />
                                        <ShieldCheck className={cn("h-6 w-6", licensePhoto ? "text-primary" : "text-slate-300")} />
                                        <span className="text-[8px] font-black uppercase">{licensePhoto ? 'License Verified' : 'Drivers License Photo'}</span>
                                    </label>
                                </div>
                                {error && <p className="text-[10px] font-black text-rose-500 uppercase">{error}</p>}
                                <Button onClick={handleVerificationSubmit} disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Review Agreement"}
                                </Button>
                            </div>
                        )}

                        {step === 'agreement' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 text-left">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase">Service Agreement</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Protocol</p>
                                </div>
                                <div className="h-64 overflow-y-auto p-6 bg-slate-50 rounded-3xl border border-slate-100 text-[10px] font-medium leading-relaxed text-slate-600 space-y-4">
                                    <p className="font-black text-foreground uppercase">DRIVER PARTNER & TRANSPORT NETWORK SERVICES AGREEMENT</p>
                                    <p>1. PURPOSE: The Company operates a digital transport network platform. The Driver wishes to provide transportation services as an independent contractor.</p>
                                    <p>2. ELIGIBILITY: Driver must provide valid ID, License, and PSV badge.</p>
                                    <p>3. VEHICLE: Vehicle must be mechanically safe, insured, and presentable.</p>
                                    <p>4. CONDUCT: Driver shall drive safely, treat passengers respectfully, and avoid fraud.</p>
                                    <p>5. INDEPENDENCE: The Driver is an independent contractor. No employment relationship is created.</p>
                                    <p>6. PRIVACY: Driver shall comply with Kenyan data protection requirements.</p>
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
                                        <span className="text-[10px] font-bold text-slate-500 group-hover:text-foreground transition-colors uppercase italic leading-tight">
                                            I have read, understood and agree to be bound by the Driver Partner & Transport Network Services Agreement.
                                        </span>
                                    </label>
                                    <Button onClick={handleDownloadAgreement} variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                                        Download PDF Copy
                                    </Button>
                                    <Button onClick={() => setStep('biometrics')} disabled={!agreedToTerms} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl shadow-primary/20">
                                        Confirm & Proceed
                                    </Button>
                                </div>
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
                                    <Button
                                        variant="ghost"
                                        onClick={async () => {
                                            if (!supabase) { setStep('pending'); return; }
                                            const { data } = await supabase.from('rider_status').select('verification_status').eq('rider_phone', normalizePhone(phone)).maybeSingle();
                                            setStep(data?.verification_status === 'Verified' ? 'success' : 'pending');
                                        }}
                                        className="w-full text-slate-400 font-black uppercase text-[10px]"
                                    >
                                        Maybe Later
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'pending' && (
                            <div className="space-y-8 text-center animate-in zoom-in-95 duration-700">
                                <div className="h-24 w-24 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mx-auto shadow-inner animate-pulse">
                                    <ShieldCheck className="h-12 w-12" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <h2 className="text-2xl font-black text-foreground uppercase text-center">Under Review</h2>
                                    <p className="text-sm text-slate-500 font-medium italic text-center">Your unit credentials have been logged and established on the grid.</p>

                                    <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Zap size={16} /></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Mission Briefing</p>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                            &quot;Protocol established. Please check back in <strong>two hours</strong>. Once your data is verified by the command center, you will be authorized to accept missions.&quot;
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Button
                                        onClick={async () => {
                                            if (!supabase) return;
                                            setLoading(true);
                                            const { data } = await supabase.from('rider_status').select('verification_status, rider_name, pin').eq('rider_phone', normalizePhone(phone)).maybeSingle();
                                            if (data?.verification_status === 'Verified') {
                                                localStorage.setItem('apex_rider_phone', normalizePhone(phone));
                                                localStorage.setItem('rider_name', data.rider_name);
                                                if (data.pin) setPin(data.pin);
                                                setStep('success');
                                            } else {
                                                setError("Verification is still pending. Please check back later.");
                                                setTimeout(() => setError(null), 3000);
                                            }
                                            setLoading(false);
                                        }}
                                        disabled={loading}
                                        className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check Authorization Status"}
                                    </Button>
                                    <Link href="/" className="block">
                                        <Button variant="ghost" className="w-full text-slate-400 font-black uppercase text-[10px]">
                                            Back to Store
                                        </Button>
                                    </Link>
                                </div>
                                {error && <p className="text-[9px] font-black uppercase text-amber-600 text-center animate-pulse">{error}</p>}
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="space-y-8 text-center animate-in zoom-in-95 duration-700 text-left">
                                <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-black text-foreground uppercase">Grid Online</h2>
                                    <p className="text-sm text-slate-500 font-medium italic">&quot;Tactical link established. Welcome to TechPax Logistics, bro.&quot;</p>
                                </div>

                                <Card className="p-6 bg-slate-900 border-none rounded-[2rem] shadow-2xl space-y-6 relative overflow-hidden">
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner"><ShieldCheck size={16} /></div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Access Credentials</p>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Tactical PIN</span>
                                            <span className="text-2xl font-black text-primary tracking-[0.3em] font-mono">{pin}</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase italic text-center px-4 leading-relaxed">
                                            * Use this PIN for future command access. Do not share your node credentials.
                                        </p>
                                    </div>
                                    <Zap className="absolute -bottom-6 -right-6 h-24 w-24 text-white/5 rotate-12" />
                                </Card>

                                <Link href="/rider/dashboard" className="block">
                                    <Button className="w-full h-18 rounded-[1.8rem] bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                        Enter Command Dashboard
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
