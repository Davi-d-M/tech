'use client';

import { useState } from 'react';
import { X, Zap, Trophy, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  image?: string;
  tech_specs?: Record<string, string>;
}

export default function CompareModal({
    p1,
    p2,
    onClose
}: {
    p1: Product,
    p2: Product,
    onClose: () => void
}) {
    const [img1Error, setImg1Error] = useState(false);
    const [img2Error, setImg2Error] = useState(false);

    // Collect all unique spec keys
    const allSpecKeys = Array.from(new Set([
        ...Object.keys(p1.tech_specs || {}),
        ...Object.keys(p2.tech_specs || {})
    ]));

    const cheaperProduct = p1.price < p2.price ? p1 : p2;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-500/10 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-[90dvh] overflow-hidden shadow-2xl flex flex-col border border-white/20">

                <header className="p-8 sm:p-12 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/50">
                    <div>
                        <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Elite Comparison</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">Deep Spec Analysis Active</p>
                    </div>
                    <button onClick={onClose} className="h-14 w-14 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300 border border-slate-100">
                        <X className="h-6 w-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 sm:p-12 no-scrollbar">
                    <div className="grid grid-cols-3 gap-8 mb-16 items-start">
                        <div className="flex flex-col items-center justify-center border-r border-slate-100 pr-8 pt-20 space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><Zap className="h-6 w-6" /></div>
                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em] rotate-180 [writing-mode:vertical-lr]">Visual Profile</p>
                        </div>

                        {/* Product 1 */}
                        <div className="text-center space-y-6 relative group">
                            {p1.id === cheaperProduct.id && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg z-20 animate-bounce">Best Value</div>
                            )}
                            <div className="aspect-square rounded-[2.5rem] bg-white flex items-center justify-center p-2 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                                {!img1Error ? (
                                    <Image
                                        src={p1.image_url || p1.image || '/placeholder.jpg'}
                                        alt={p1.name}
                                        fill
                                        className="object-contain p-4 transform group-hover:scale-110 transition-transform duration-700"
                                        onError={() => setImg1Error(true)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <EyeOff className="h-8 w-8" />
                                        <span className="text-[8px] font-black uppercase">Image Load Error</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-2">
                                <h3 className="font-black text-foreground uppercase text-[11px] sm:text-xs tracking-tight mb-2 h-8 line-clamp-2 leading-none">{p1.name}</h3>
                                <p className="text-2xl font-black text-primary tracking-tighter">{formatPrice(p1.price)}</p>
                            </div>
                        </div>

                        {/* Product 2 */}
                        <div className="text-center space-y-6 relative group">
                            {p2.id === cheaperProduct.id && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg z-20 animate-bounce">Best Value</div>
                            )}
                            <div className="aspect-square rounded-[2.5rem] bg-white flex items-center justify-center p-2 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                                {!img2Error ? (
                                    <Image
                                        src={p2.image_url || p2.image || '/placeholder.jpg'}
                                        alt={p2.name}
                                        fill
                                        className="object-contain p-4 transform group-hover:scale-110 transition-transform duration-700"
                                        onError={() => setImg2Error(true)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <EyeOff className="h-8 w-8" />
                                        <span className="text-[8px] font-black uppercase">Image Load Error</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-2">
                                <h3 className="font-black text-foreground uppercase text-[11px] sm:text-xs tracking-tight mb-2 h-8 line-clamp-2 leading-none">{p2.name}</h3>
                                <p className="text-2xl font-black text-primary tracking-tighter">{formatPrice(p2.price)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-8 items-center py-4 px-6 bg-slate-50 border border-slate-100 rounded-2xl mb-6 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Technical Specs</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground text-center">Unit Alpha</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground text-center">Unit Beta</span>
                        </div>

                        {allSpecKeys.map(key => (
                            <div key={key} className="grid grid-cols-3 gap-8 items-center py-6 border-b border-slate-50 hover:bg-slate-50/50 rounded-2xl transition-colors group/row">
                                <div className="pl-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/row:text-primary transition-colors">{key}</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-bold text-foreground">{p1.tech_specs?.[key] || 'Not specified'}</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-bold text-foreground">{p2.tech_specs?.[key] || 'Not specified'}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-primary/10"><Trophy className="h-6 w-6" /></div>
                            <div>
                                <p className="font-black text-foreground uppercase text-xs">Apex Recommendation</p>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Best choice for your elite setup</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Pick of the day</p>
                            <p className="font-black text-foreground uppercase text-[10px] sm:text-xs tracking-tight">{cheaperProduct.name}</p>
                        </div>
                    </div>
                </div>

                <footer className="p-8 border-t border-slate-50 flex gap-4 shrink-0 bg-white">
                    <Button onClick={onClose} className="flex-1 h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-95 transition-all">Close Comparison View</Button>
                </footer>

            </div>
        </div>
    );
}
