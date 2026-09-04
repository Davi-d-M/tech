'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Download,
  Calendar,
  RefreshCcw,
  TrendingUp,
  DollarSign,
  Package,
  FileText,
  Clock,
  PieChart,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminReportsPage() {
    const [orders, setOrders] = useState<{ id: number; customer_name: string; total_price: number; status: string; payment_method: string; created_at: string }[]>([]);
    const [products, setProducts] = useState<{ id: number; name: string; category: string; price: number; stock: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [ordersRes, productsRes] = await Promise.all([
                supabase.from('orders').select('*').order('created_at', { ascending: false }),
                supabase.from('products').select('*')
            ]);
            setOrders(ordersRes.data || []);
            setProducts(productsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const generatePDF = (type: 'Daily' | 'Weekly' | 'Monthly' | 'Profit' | 'Inventory' | 'Custom') => {
        setGenerating(type);
        const doc = new jsPDF() as jsPDF & { autoTable: (options: unknown) => void; lastAutoTable: { finalY: number } };
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-KE', { dateStyle: 'full' });

        // Header
        doc.setFontSize(22);
        doc.setTextColor(255, 107, 0); // Apex Primary
        doc.text('APEXSTORES TECH KENYA', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`${type === 'Custom' ? 'STRATEGIC' : type.toUpperCase()} PERFORMANCE REPORT`, 105, 28, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generated on: ${dateStr}`, 105, 34, { align: 'center' });

        // Filtering data based on type
        let filteredOrders = orders;
        const oneDay = 24 * 60 * 60 * 1000;
        if (type === 'Daily') {
            filteredOrders = orders.filter(o => (now.getTime() - new Date(o.created_at).getTime()) < oneDay);
        } else if (type === 'Weekly') {
            filteredOrders = orders.filter(o => (now.getTime() - new Date(o.created_at).getTime()) < (oneDay * 7));
        } else if (type === 'Monthly') {
            filteredOrders = orders.filter(o => (now.getTime() - new Date(o.created_at).getTime()) < (oneDay * 30));
        } else if (type === 'Custom' && startDate && endDate) {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime() + oneDay; // End of day
            filteredOrders = orders.filter(o => {
                const d = new Date(o.created_at).getTime();
                return d >= start && d <= end;
            });
            doc.setFontSize(8);
            doc.text(`Range: ${startDate} to ${endDate}`, 105, 38, { align: 'center' });
        }

        const totalRevenue = filteredOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.total_price, 0);
        const totalItems = filteredOrders.length;
        const pendingCount = filteredOrders.filter(o => o.status === 'Pending').length;

        // Stats Section
        doc.setDrawColor(240, 240, 240);
        doc.setFillColor(250, 250, 250);
        doc.rect(14, 45, 182, 30, 'F');
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text('KEY PERFORMANCE INDICATORS', 20, 52);
        doc.setFontSize(12);
        doc.text(`Revenue: Ksh ${totalRevenue.toLocaleString()}`, 20, 62);
        doc.text(`Orders: ${totalItems}`, 85, 62);
        doc.text(`Pending: ${pendingCount}`, 145, 62);

        // Table
        if (type === 'Inventory') {
            doc.autoTable({
                startY: 85,
                head: [['ID', 'Gadget Name', 'Category', 'Price', 'Stock Level']],
                body: products.map(p => [p.id, p.name, p.category, p.price, p.stock]),
                theme: 'striped',
                headStyles: { fillColor: [255, 107, 0] },
            });
        } else {
            doc.autoTable({
                startY: 85,
                head: [['ID', 'Customer', 'Amount', 'Status', 'Method', 'Date']],
                body: filteredOrders.map(o => [o.id, o.customer_name, formatPrice(o.total_price), o.status, o.payment_method, new Date(o.created_at).toLocaleDateString()]),
                theme: 'striped',
                headStyles: { fillColor: [255, 107, 0] },
            });
        }

        // Footer
        const finalY = doc.lastAutoTable?.finalY || 150;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Confidential Internal Report - Apexstores Property', 105, finalY + 20, { align: 'center' });

        doc.save(`Apex_Report_${type}_${now.toISOString().split('T')[0]}.pdf`);
        setGenerating(null);
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Executive Reports</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1 italic">High-fidelity data exports for strategic business review.</p>
                </div>
                <Button onClick={fetchData} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-lg">
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Database
                </Button>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Daily Pulse', desc: 'Last 24 hours', icon: Clock, type: 'Daily' },
                    { label: 'Weekly Sync', desc: 'Past 7 days', icon: Calendar, type: 'Weekly' },
                    { label: 'Monthly Audit', desc: 'Full month', icon: FileText, type: 'Monthly' },
                    { label: 'Inventory', desc: 'Stock mapping', icon: Package, type: 'Inventory' },
                ].map((r) => (
                    <Card key={r.label} className="p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col items-center text-center">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 sm:mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <r.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <h3 className="font-black text-foreground uppercase tracking-tight text-sm sm:text-lg mb-1 sm:mb-2">{r.label}</h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 sm:mb-8">{r.desc}</p>

                        <Button
                            onClick={() => generatePDF(r.type as 'Daily' | 'Weekly' | 'Monthly' | 'Profit' | 'Inventory' | 'Custom')}
                            disabled={generating !== null}
                            className="w-full h-10 sm:h-12 rounded-xl bg-primary text-white font-black uppercase text-[8px] sm:text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            {generating === r.type ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <><Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> PDF</>}
                        </Button>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-12 pt-8">
                <Card className="lg:col-span-2 rounded-[3rem] p-12 border-2 border-primary/10 bg-white text-foreground relative overflow-hidden shadow-2xl group hover:border-primary/30 transition-all">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-12 text-left">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/10">
                                <TrendingUp className="h-3 w-3" /> Profit Analytics
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-left">Automated <br/> <span className="text-primary italic">Monday Dispatch</span></h2>
                            <p className="text-slate-500 font-medium max-w-md italic text-left leading-relaxed">Your Weekly Performance Report is automatically compiled and dispatched to your email every Monday at 08:00 AM.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex-1 text-left">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest leading-none">Last Sent</p>
                                <p className="text-sm font-black text-foreground uppercase">Awaiting First Dispatch</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex-1 text-left">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest leading-none">Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                    <p className="text-sm font-black text-primary uppercase">Ready</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <PieChart className="absolute -bottom-20 -right-20 h-80 w-80 text-primary/5 rotate-12" />
                </Card>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Custom Data Range
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-slate-300 ml-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-slate-300 ml-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-xs font-bold"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    if (!startDate || !endDate) {
                                        alert("Please select both start and end dates.");
                                        return;
                                    }
                                    generatePDF('Custom');
                                }}
                                variant="outline"
                                className="w-full h-12 rounded-xl mt-4 font-black uppercase text-[10px] border-slate-100 hover:border-primary hover:text-primary transition-all"
                            >
                                {generating === 'Custom' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Custom Audit'}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 text-foreground shadow-sm relative overflow-hidden">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-primary">Pro Tip</h4>
                        <p className="text-sm font-bold leading-relaxed italic text-slate-500">&quot;Always check the Inventory Health report before placing orders with suppliers to avoid dead stock.&quot;</p>
                        <ShieldCheck className="absolute -bottom-4 -right-4 h-24 w-24 text-primary/5 rotate-12" />
                    </div>
                </div>
            </div>
        </div>
    );
}
