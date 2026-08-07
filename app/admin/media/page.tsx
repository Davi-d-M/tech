'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    ImageIcon,
    Plus,
    Trash2,
    Copy,
    CheckCircle2,
    Loader2,
    Search,
    FileText,
    Share2,
    Smartphone,
    Camera,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { generateProductCatalog } from '@/lib/catalogService';

import { useSearchParams } from 'next/navigation';

interface CloudAsset {
    name: string;
    id: string;
    updated_at: string;
    url: string;
    folder: 'products' | 'posters' | 'banners';
}

export default function AdminMediaHub() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [assets, setAssets] = useState<CloudAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [generatingCatalog, setGeneratingCatalog] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'products' | 'posters' | 'banners'>('products');

    useEffect(() => {
        if (tabParam === 'posters' || tabParam === 'banners') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const BUCKET_NAME = 'apexstores-assets';

    const fetchAssets = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const folders = ['products', 'posters', 'banners'] as const;
            let allEnriched: CloudAsset[] = [];

            for (const folder of folders) {
                const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
                    limit: 50,
                    sortBy: { column: 'name', order: 'desc' }
                });

                if (error) continue;

                const enriched = data.map(file => {
                    const { data: { publicUrl } } = supabase!.storage.from(BUCKET_NAME).getPublicUrl(`${folder}/${file.name}`);
                    return {
                        ...file,
                        url: publicUrl,
                        folder
                    } as CloudAsset;
                });
                allEnriched = [...allEnriched, ...enriched];
            }

            setAssets(allEnriched);
        } catch (err: unknown) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !supabase) return;
        setUploading(true);
        try {
            const files = Array.from(e.target.files);
            const uploadPromises = files.map(async (file) => {
                const filePath = `${activeTab}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                return supabase!.storage.from(BUCKET_NAME).upload(filePath, file);
            });

            await Promise.all(uploadPromises);
            fetchAssets();
        } catch (err: unknown) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const deleteAsset = async (asset: CloudAsset) => {
        if (!supabase || !confirm("Delete this asset permanently?")) return;
        try {
            const { error } = await supabase.storage.from(BUCKET_NAME).remove([`${asset.folder}/${asset.name}`]);
            if (error) throw error;
            setAssets(prev => prev.filter(a => a.name !== asset.name));
        } catch (err: unknown) {
            console.error(err);
        }
    };

    const handleDownloadCatalog = async () => {
        setGeneratingCatalog(true);
        try {
            const month = new Date().toLocaleString('default', { month: 'long' });
            const doc = await generateProductCatalog(month);
            doc.save(`Apexstores_Catalog_${month}_2026.pdf`);
        } catch (err: unknown) {
            const error = err as Error;
            alert(error.message);
        } finally {
            setGeneratingCatalog(false);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const filteredAssets = assets.filter(a =>
        a.folder === activeTab &&
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left selection:bg-primary/20 pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Brand Media Hub</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Central repository for product shoots, marketing posters, and banners.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadCatalog} disabled={generatingCatalog} className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                        {generatingCatalog ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                        Generate Catalog PDF
                    </Button>
                    <div className="relative">
                        <Input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" id="asset-upload" disabled={uploading} />
                        <label htmlFor="asset-upload" className={cn(
                            "flex items-center gap-2 h-12 px-6 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95",
                            uploading && "opacity-50 cursor-wait"
                        )}>
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Upload to {activeTab}
                        </label>
                    </div>
                </div>
            </header>

            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-2xl">
                {[
                    { id: 'products', label: 'Product Shoots', icon: Smartphone },
                    { id: 'posters', label: 'IG Posters', icon: Camera },
                    { id: 'banners', label: 'WA Banners', icon: MessageSquare },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'products' | 'posters' | 'banners')}
                        className={cn(
                            "flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 border-transparent",
                            activeTab === tab.id ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-foreground"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-3 space-y-6">
                    <Card className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Library Intel</h2>
                        <div className="space-y-6 text-left">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <span className="text-[9px] font-black uppercase text-slate-400">Section</span>
                                <span className="text-xs font-black text-foreground uppercase">{activeTab}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <span className="text-[9px] font-black uppercase text-slate-400">Total Count</span>
                                <span className="text-xs font-black text-foreground">{filteredAssets.length} Units</span>
                            </div>
                        </div>
                    </Card>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filter assets..."
                            className="h-14 rounded-[1.5rem] bg-white border-slate-100 pl-12 text-xs font-black uppercase tracking-widest shadow-sm focus:ring-4 focus:ring-primary/5"
                        />
                    </div>
                </div>

                <div className="lg:col-span-9">
                    {loading ? (
                        <div className="p-32 text-center flex flex-col items-center gap-4 bg-white rounded-[3rem] border border-slate-100">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Extracting Cloud Payload...</p>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="p-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-inner flex flex-col items-center gap-6">
                            <ImageIcon className="h-20 w-20 text-slate-50" />
                            <p className="text-xl font-black text-slate-300 uppercase italic">Sector Empty.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredAssets.map((asset, i) => (
                                <Card key={i} className="group rounded-[2rem] border border-slate-100 bg-white overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all flex flex-col">
                                    <div className="aspect-square bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={asset.url} className="max-h-full w-auto object-contain transform group-hover:scale-110 transition-transform duration-500" alt="" />

                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                            <Button
                                                onClick={() => copyToClipboard(asset.url)}
                                                className="w-full bg-white text-foreground hover:bg-slate-50 font-black uppercase text-[8px] h-10 rounded-xl border border-slate-100 shadow-sm"
                                            >
                                                {copiedUrl === asset.url ? <CheckCircle2 className="h-3 w-3 mr-2 text-primary" /> : <Copy className="h-3 w-3 mr-2" />}
                                                {copiedUrl === asset.url ? 'Copied' : 'Copy URL'}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    const text = `Check out our elite tech at Apexstores! 🚀\n\n${asset.url}`;
                                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                }}
                                                className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-black uppercase text-[8px] h-10 rounded-xl border border-emerald-100"
                                            >
                                                <Share2 className="h-3 w-3 mr-2" /> Share
                                            </Button>
                                            <Button
                                                onClick={() => deleteAsset(asset)}
                                                variant="ghost"
                                                className="w-full text-slate-400 hover:text-rose-600 font-black uppercase text-[8px] h-10 rounded-xl"
                                            >
                                                <Trash2 className="h-3 w-3 mr-2" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-slate-50">
                                        <p className="text-[9px] font-black uppercase text-foreground truncate tracking-tight">{asset.name}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Uploaded {new Date(asset.updated_at).toLocaleDateString()}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
