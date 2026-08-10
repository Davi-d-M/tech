'use client';

import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, User } from 'lucide-react';
import Image from 'next/image';

interface InstagramPreviewProps {
    productName: string;
    imageUrl: string;
    caption: string;
}

export default function InstagramPreview({ productName, imageUrl, caption }: InstagramPreviewProps) {
    return (
        <div className="max-w-[350px] mx-auto bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            {/* IG Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 via-primary to-rose-500 p-[2px]">
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                            <div className="h-[22px] w-[22px] rounded-full bg-slate-100 flex items-center justify-center">
                                <User size={14} className="text-slate-400" />
                            </div>
                        </div>
                    </div>
                    <p className="text-[11px] font-black uppercase text-foreground tracking-tight">apexstores_kenya</p>
                </div>
                <MoreHorizontal size={16} className="text-slate-400" />
            </div>

            {/* Main Visual */}
            <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                    <Image src={imageUrl} fill className="object-contain p-6" alt="Preview" />
                ) : (
                    <div className="text-center space-y-3 opacity-20">
                        <User size={48} className="mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Asset...</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Heart size={20} className="text-slate-800" />
                        <MessageCircle size={20} className="text-slate-800" />
                        <Send size={20} className="text-slate-800" />
                    </div>
                    <Bookmark size={20} className="text-slate-800" />
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-foreground">842 likes</p>
                    <div className="text-[11px] leading-relaxed">
                        <span className="font-black mr-2 uppercase">apexstores_kenya</span>
                        <span className="text-slate-600 italic whitespace-pre-wrap">{caption || "Write your tactical hook in the content assistant..."}</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest pt-1">2 MINUTES AGO</p>
                </div>
            </div>
        </div>
    );
}
