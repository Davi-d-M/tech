'use client';

import * as React from 'react';
import { useAdmin } from '@/context/AdminContext';
import { supabase } from '@/lib/supabaseClient';
import {
    Box,
    RefreshCcw,
    Save,
    Loader2,
    Search,
    Edit3,
    X,
    CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, cn } from '@/lib/utils';

interface Product {
    id: number;
    name: string;
    stock: number;
    price: number;
    status: string;
    image_url: string;
}

export default function SupplierInventory() {
    const { supplier_id } = useAdmin();
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [updatingId, setUpdatingId] = React.useState<number | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isEditing, setIsEditing] = React.useState<Product | null>(null);

    const fetchInventory = React.useCallback(async () => {
        if (!supabase || !supplier_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, stock, price, status, image_url')
                .eq('supplier_id', supplier_id);

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [supplier_id]);

    React.useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleUpdateStock = async (id: number, newStock: number) => {
        if (!supabase) return;
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('products')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Box className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Live Inventory</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Stock Pulse</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Pulse-update your availability to keep the grid synchronized.</p>
                </div>
                <Button onClick={fetchInventory} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all">
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh Grid
                </Button>
            </header>

            <div className="relative">
                <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search your gadgets..."
                    className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-white rounded-[3rem] border border-slate-50 animate-pulse" />
                    ))
                ) : filteredProducts.map(p => (
                    <Card key={p.id} className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 p-3 border border-slate-100 flex items-center justify-center shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.image_url || '/placeholder.jpg'} alt="" className="max-h-full w-auto object-contain" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black text-foreground uppercase tracking-tight truncate">{p.name}</h3>
                                <p className="text-[10px] font-bold text-primary uppercase mt-1 tracking-widest">{formatPrice(p.price)}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsEditing(p)}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-slate-100 text-slate-400 hover:text-primary transition-all"
                            >
                                <Edit3 size={16} className="mr-2" /> Modify Props
                            </Button>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    defaultValue={p.stock}
                                    onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val !== p.stock) {
                                            handleUpdateStock(p.id, val);
                                        }
                                    }}
                                    className="h-12 w-20 rounded-xl border-slate-100 bg-slate-50/50 text-center font-black"
                                />
                                <Button
                                    disabled={updatingId === p.id}
                                    className="h-12 w-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
                                >
                                    {updatingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                </Button>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border",
                                p.status === 'Live' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                                {p.status}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* EDITING MODAL */}
            {isEditing && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/20 backdrop-blur-md p-6">
                    <Card className="max-w-xl w-full bg-white rounded-[3.5rem] border border-border shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-500 text-left">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Edit3 size={24} /></div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Refine Payload</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modify Listing Attributes</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditing(null)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Gadget Title</label>
                                <Input value={isEditing.name} readOnly className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold opacity-60" />
                                <p className="text-[8px] font-bold text-slate-400 uppercase italic leading-relaxed px-1">
                                    * Title and SKU changes require Command Center authorization.
                                </p>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Retail Pricing (KES)</label>
                                <Input type="number" value={isEditing.price} readOnly className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black text-lg text-primary opacity-60" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Grid Status</label>
                                    <select
                                        value={isEditing.status}
                                        onChange={e => setIsEditing({...isEditing, status: e.target.value})}
                                        className="w-full h-14 rounded-2xl bg-secondary border border-border px-4 text-xs font-black uppercase text-foreground outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="Live">Live Grid</option>
                                        <option value="Pending">Draft / Hidden</option>
                                        <option value="Sold Out">Out of Stock</option>
                                    </select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Current Base Stock</label>
                                    <Input
                                        type="number"
                                        value={isEditing.stock}
                                        onChange={e => setIsEditing({...isEditing, stock: Number(e.target.value)})}
                                        className="h-14 rounded-2xl bg-secondary border-border font-black text-lg text-foreground"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border flex gap-4">
                            <Button
                                onClick={async () => {
                                    if (!supabase || !isEditing) return;
                                    setLoading(true);
                                    await supabase.from('products').update({
                                        status: isEditing.status,
                                        stock: isEditing.stock,
                                        updated_at: new Date().toISOString()
                                    }).eq('id', isEditing.id);
                                    fetchInventory();
                                    setIsEditing(null);
                                }}
                                className="flex-1 h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <CheckCircle2 size={18} className="mr-2" /> Sync Attributes
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}
