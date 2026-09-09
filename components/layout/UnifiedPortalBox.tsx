'use client';

import React from 'react';
import { useSettings } from '@/lib/useSettings';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UnifiedPortalBoxProps {
    title: string;
    description: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    loading?: boolean;
}

export default function UnifiedPortalBox({ title, description, children, icon, loading }: UnifiedPortalBoxProps) {
    const { settings } = useSettings();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 text-left selection:bg-primary/20">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic animate-pulse">Establishing Node Link...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20 overflow-hidden">
                                {settings?.branding?.logo_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={settings.branding.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                                ) : (
                                    icon || <div className="h-8 w-8 bg-primary rounded-lg" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">{title}</h1>
                                <p className="mt-2 text-sm text-slate-500 font-medium italic">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {children}
                        </div>

                        <div className="text-center pt-4 border-t border-slate-50">
                            <Link href="/" className="text-[10px] font-black text-slate-300 hover:text-primary uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                                <ArrowLeft size={12} /> Back to Shop
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {/* Corner Decor */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </div>
    );
}
