'use client';

import React from 'react';
import { CheckCheck } from 'lucide-react';
import Image from 'next/image';

interface WhatsAppPreviewProps {
    imageUrl: string;
    body: string;
}

export default function WhatsAppPreview({ imageUrl, body }: WhatsAppPreviewProps) {
    return (
        <div className="max-w-[320px] mx-auto bg-[#f0f0f0] rounded-[2.5rem] border-[8px] border-slate-200 h-[560px] overflow-hidden shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-500">
            {/* WA Header */}
            <div className="bg-[#075e54] p-6 pt-10 text-white flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs uppercase">AS</div>
                <div>
                    <p className="text-xs font-black uppercase tracking-tight">Apexstores Business</p>
                    <p className="text-[8px] font-medium opacity-70 italic">Online</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
                <div className="bg-white rounded-2xl p-2 pb-1 shadow-sm max-w-[90%] animate-in slide-in-from-left-4 duration-700">
                    {imageUrl && (
                        <div className="aspect-video bg-slate-50 rounded-xl mb-2 relative overflow-hidden flex items-center justify-center p-4">
                            <Image src={imageUrl} fill className="object-contain" alt="Preview" />
                        </div>
                    )}
                    <div className="px-2 py-1 space-y-2">
                        <p className="text-[11px] leading-relaxed text-foreground whitespace-pre-wrap">
                            {body || "Design your direct message copy in the Content Assistant step..."}
                        </p>
                        <div className="flex justify-end items-center gap-1">
                            <span className="text-[8px] text-slate-400 font-bold">12:30</span>
                            <CheckCheck size={12} className="text-[#34b7f1]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-white p-4 border-t border-slate-200">
                <div className="h-8 w-full bg-slate-50 rounded-full border border-slate-100 flex items-center px-4">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Type message...</p>
                </div>
            </div>
        </div>
    );
}
