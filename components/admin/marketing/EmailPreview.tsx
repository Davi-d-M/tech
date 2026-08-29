'use client';

import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

interface EmailPreviewProps {
    productName: string;
    productPrice: number;
    imageUrl: string;
    subject: string;
    body: string;
}

export default function EmailPreview({ productName, productPrice, imageUrl, subject, body }: EmailPreviewProps) {
    return (
        <div className="max-w-[450px] mx-auto bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col">
            {/* Browser-like Header */}
            <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3">
                <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-rose-400"></div>
                    <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                    <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg h-6 flex items-center px-3">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Inbox &bull; Apexstores Tech Alert</p>
                </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 bg-white m-4 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                {/* Email Header Branding */}
                <div className="p-8 border-b border-slate-50 text-center">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-foreground">
                        Apex<span className="text-primary">stores</span>
                    </h1>
                </div>

                <div className="p-8 space-y-8 text-center flex-1">
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">New Arrival Protocol</p>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">{subject || "Tactical Drop incoming..."}</h2>
                    </div>

                    <div className="aspect-video bg-slate-50 rounded-2xl relative overflow-hidden flex items-center justify-center p-6 border border-slate-100">
                        {imageUrl ? (
                            <Image src={imageUrl} fill className="object-contain p-4" alt="Preview" />
                        ) : (
                            <Zap size={48} className="text-slate-100" />
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase text-foreground">{productName || "Gadget Specification"}</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic whitespace-pre-wrap">
                            {body || "Design your email narrative in the content assistant step..."}
                        </p>
                    </div>

                    <div className="pt-4">
                        <button className="bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] px-10 py-4 rounded-xl shadow-xl shadow-primary/20">
                            Secure Item &bull; {formatPrice(productPrice)}
                        </button>
                    </div>
                </div>

                {/* Email Footer */}
                <div className="bg-slate-50 p-8 text-center space-y-4">
                    <div className="flex justify-center gap-4 text-slate-300">
                        <ShieldCheck size={16} />
                        <Zap size={16} />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 APEXSTORES KENYA &bull; UNLOCK PERFORMANCE</p>
                    <p className="text-[7px] text-slate-300 uppercase underline cursor-pointer">Unsubscribe from tech alerts</p>
                </div>
            </div>
        </div>
    );
}
