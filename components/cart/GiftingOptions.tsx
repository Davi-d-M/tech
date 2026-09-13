'use client';

import * as React from 'react';
import { Gift, MessageSquare, User, Smartphone, Sparkles, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const WRAPPING_OPTIONS = [
    { id: 'Standard', label: 'Classic Wrap', price: 0, desc: 'Eco-friendly minimal wrap.' },
    { id: 'Premium', label: 'Premium Velvet', price: 500, desc: 'Velvet texture with gold seal.' },
    { id: 'Elite', label: 'Elite Obsidian', price: 1200, desc: 'Hard case box with luxury ribbon.' },
];

export default function GiftingOptions() {
    const { gifting, updateGifting } = useCart();
    const [isOpen, setIsOpen] = React.useState(false);

    if (!isOpen && !gifting.isGift) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                        <Gift size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-foreground">Gift this order?</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Add wrapping & personal note</p>
                    </div>
                </div>
                <Sparkles size={14} className="text-slate-200 group-hover:text-primary animate-pulse" />
            </button>
        );
    }

    return (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Gifting Protocol</h3>
                </div>
                <button onClick={() => { setIsOpen(false); updateGifting({ isGift: false }); }} className="text-slate-300 hover:text-rose-500"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {WRAPPING_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => updateGifting({ isGift: true, wrapping: opt.id as any })}
                        className={cn(
                            "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                            gifting.wrapping === opt.id
                                ? "border-primary bg-primary/5 shadow-lg"
                                : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                        )}
                    >
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase text-foreground">{opt.label}</p>
                                <p className="text-[8px] font-medium text-slate-500 italic mt-0.5">{opt.desc}</p>
                            </div>
                            <span className="text-[10px] font-black text-primary">
                                {opt.price === 0 ? 'FREE' : `+ KSh ${opt.price}`}
                            </span>
                        </div>
                        {gifting.wrapping === opt.id && (
                            <Sparkles className="absolute -bottom-2 -right-2 h-12 w-12 text-primary/10 rotate-12" />
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Personal Message</label>
                    <Textarea
                        value={gifting.message}
                        onChange={e => updateGifting({ message: e.target.value })}
                        placeholder="Write something elite..."
                        className="h-24 rounded-2xl bg-slate-50 border-slate-100 text-xs font-medium italic resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Recipient Name</label>
                        <div className="relative">
                            <Input
                                value={gifting.recipientName}
                                onChange={e => updateGifting({ recipientName: e.target.value })}
                                className="h-10 rounded-xl bg-slate-50 border-slate-100 pl-8 text-[10px] font-bold"
                                placeholder="Name"
                            />
                            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Recipient Phone</label>
                        <div className="relative">
                            <Input
                                value={gifting.recipientPhone}
                                onChange={e => updateGifting({ recipientPhone: e.target.value })}
                                className="h-10 rounded-xl bg-slate-50 border-slate-100 pl-8 text-[10px] font-bold"
                                placeholder="07XXXXXXXX"
                            />
                            <Smartphone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
