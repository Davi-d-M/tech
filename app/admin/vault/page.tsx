'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    FileText,
    Search,
    Download,
    ShieldCheck,
    History,
    Trash2,
    Plus,
    Filter,
    Clock,
    Lock,
    Folder,
    MoreVertical,
    ArrowUpRight,
    RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Document {
    id: string;
    name: string;
    type: 'Invoice' | 'Receipt' | 'Report' | 'Contract';
    size: string;
    created_at: string;
    authorized_by: string;
}

export default function DocumentVault() {
    const { email: adminEmail } = useAdmin();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [documents, setDocuments] = React.useState<Document[]>([]);

    React.useEffect(() => {
        async function fetchDocs() {
            if (!supabase) return;
            try {
                const { data, error } = await supabase.from('admin_vault').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                setDocuments(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDocs();
    }, []);

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Secure Repository</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Document Vault</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Centralized document management with immutable audit trails.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className="h-4 w-4 mr-2" /> Sync Vault
                    </Button>
                    <Button className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                        <Plus className="h-4 w-4 mr-2" /> Secure Upload
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Storage Used', val: '4.2 GB', icon: Folder, color: 'indigo' },
                    { label: 'Total Files', val: '1,240', icon: FileText, color: 'primary' },
                    { label: 'Security Level', val: 'Bank-Grade', icon: ShieldCheck, color: 'emerald' },
                ].map((item) => (
                    <Card key={item.label} className="p-8 rounded-[3rem] border border-border bg-card shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="relative z-10">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                item.color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                                item.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                                "bg-primary/10 text-primary"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{item.val}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="bg-card rounded-[3.5rem] border border-border shadow-sm overflow-hidden text-left">
                <div className="p-10 border-b border-border flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3"><Folder className="h-6 w-6 text-primary" /> Root Directory</h2>
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Find document by ID or name..."
                            className="h-14 rounded-2xl bg-secondary border-border pl-12 text-sm font-bold shadow-inner"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em]">
                                <th className="px-10 py-6">Document Identity</th>
                                <th className="px-10 py-6">Type</th>
                                <th className="px-10 py-6 text-center">Size</th>
                                <th className="px-10 py-6 text-center">Authored</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-primary/5 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">{doc.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {doc.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                            doc.type === 'Report' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                            doc.type === 'Invoice' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            "bg-slate-50 text-slate-500 border-slate-200"
                                        )}>{doc.type}</span>
                                    </td>
                                    <td className="px-10 py-8 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">{doc.size}</td>
                                    <td className="px-10 py-8 text-center">
                                        <p className="text-[10px] font-bold text-foreground uppercase">{doc.created_at}</p>
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mt-1">{doc.authorized_by}</p>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:text-primary transition-all shadow-sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:text-rose-500 transition-all shadow-sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" className="h-10 w-10 rounded-xl bg-primary text-white hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
