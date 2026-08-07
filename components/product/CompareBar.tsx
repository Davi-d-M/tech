'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, X, Zap } from 'lucide-react';
import CompareModal from './CompareModal';
import Image from 'next/image';

export default function CompareBar() {
    const { compareList, toggleCompare } = useCart();
    const [showModal, setShowModal] = useState(false);

    if (compareList.length === 0) return null;

    return (
        <>
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] bg-white/90 backdrop-blur-xl rounded-full p-2 pl-6 pr-6 shadow-2xl border border-slate-100 flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white">
                        <ArrowUpDown className="h-3 w-3" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
                        {compareList.length} Items Selected
                    </span>
                </div>

                <div className="flex gap-2">
                    {compareList.map(item => (
                        <div key={item.id} className="relative group">
                            <div className="h-10 w-10 rounded-full bg-slate-100 p-1.5 border border-slate-200 flex items-center justify-center overflow-hidden relative">
                                <Image src={item.image_url || item.image || '/placeholder.jpg'} alt="" fill className="object-contain p-1" />
                            </div>
                            <button
                                onClick={() => toggleCompare(item)}
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>

                {compareList.length === 2 && (
                    <Button
                        onClick={() => setShowModal(true)}
                        className="h-10 rounded-full bg-primary text-white font-black uppercase text-[9px] tracking-widest px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        <Zap className="h-3 w-3 mr-2 fill-current" /> Compare Now
                    </Button>
                )}

                {compareList.length === 1 && (
                    <span className="text-[8px] font-bold text-slate-400 uppercase italic">Select 1 more to compare</span>
                )}
            </div>

            {showModal && compareList.length === 2 && (
                <CompareModal
                    p1={compareList[0]}
                    p2={compareList[1]}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
