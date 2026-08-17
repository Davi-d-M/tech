'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import {
    RefreshCcw,
    Rocket,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    TrendingUp as ProfitIcon,
    Smartphone,
    Info,
    Plus,
    ImageIcon,
    Layers,
    PackageCheck,
    Sparkles,
    Loader2,
    FileText,
    Download,
    DollarSign,
    X,
    Trash2,
    Camera
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';
import { useSettings } from '@/lib/useSettings';

const initialForm = {
  name: '',
  brand: '',
  category: 'electronics',
  sku: '',
  model_number: '',
  price: '',
  cost_price: '',
  old_price: '',
  description: '',
  short_description: '',
  what_is_in_the_box: '',
  sizes: 'Standard',
  stock: '',
  low_stock_alert: '5',
  warehouse_location: '',
  sale_end_date: '',
  featured_rank: '99',
  is_featured: false,
  is_best_seller: false,
  allow_backorders: false,
  hide_product: false,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  weight_kg: '',
  length_cm: '',
  width_cm: '',
  height_cm: '',
};

interface Product {
  id: number;
  name: string;
  brand?: string;
  sku?: string;
  model_number?: string;
  price: number;
  cost_price: number;
  old_price?: number;
  description: string;
  short_description?: string;
  what_is_in_the_box?: string;
  image_url: string;
  video_url?: string;
  images: string[];
  sizes: string[];
  stock: number;
  low_stock_alert?: number;
  warehouse_location?: string;
  category: string;
  sale_end_date?: string;
  featured_rank?: number;
  is_featured?: boolean;
  is_best_seller?: boolean;
  allow_backorders?: boolean;
  hide_product?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  weight_kg?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  variant_stock?: Record<string, number>;
  tech_specs?: Record<string, string>;
}

export default function AdminUploadPage() {
    return (
        <Suspense fallback={<div className="p-24 text-center animate-pulse font-black text-slate-400 uppercase">Establishing Stock Sync...</div>}>
            <UploadContent />
        </Suspense>
    );
}

function UploadContent() {
  const { role, email } = useAdmin();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'live' | 'proposals'>('live');
  const [form, setForm] = useState(initialForm);
  const [variantStock, setVariantStock] = useState<Record<string, string>>({});
  const [techSpecs, setTechSpecs] = useState<{ key: string, value: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
      basic: true,
      pricing: true,
      inventory: true,
      description: true,
      media: true,
      shipping: false,
      seo: false,
      status: true
  });

  const toggleSection = (id: string) => {
      setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== url));
  };

  const canManageInventory = role === 'staff' || role === 'admin' || role === 'owner';

  const fetchProducts = async () => {
    if (!supabase) return;
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchProducts();
    }
  }, []);

  const currentVariants = useMemo(() => {
    return (form?.sizes || '').split(',').map(s => s.trim()).filter(s => s);
  }, [form.sizes]);

  const profitIntel = useMemo(() => {
      const sell = Number(form.price) || 0;
      const cost = Number(form.cost_price) || 0;
      const finalPrice = sell;
      const profit = finalPrice - cost;
      const margin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
      return { profit, margin };
  }, [form.price, form.cost_price]);

  const stockIntelligence = useMemo(() => {
      if (!editingId) return null;

      const currentStock = Number(form.stock) || 0;
      const avgDailySales = 1.2; // This should be calculated from real orders in a production system
      const daysRemaining = avgDailySales > 0 ? (currentStock / avgDailySales).toFixed(1) : '∞';
      const reorderPoint = 8;
      const isReorderUrgent = currentStock <= reorderPoint;

      return {
          currentStock,
          avgDailySales,
          daysRemaining,
          reorderPoint,
          isReorderUrgent
      };
  }, [editingId, form.stock]);

  const formCompletion = useMemo(() => {
      const fields = [form.name, form.price, form.category, form.description];
      const completed = fields.filter(f => f).length;
      return Math.round((completed / fields.length) * 100);
  }, [form]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value, type } = target;
    const val = type === 'checkbox' ? (target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleVariantStockChange = (variant: string, value: string) => {
    setVariantStock(prev => ({ ...prev, [variant]: value }));
  };

  const handleAddSpec = () => setTechSpecs([...techSpecs, { key: '', value: '' }]);
  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
      const newSpecs = [...techSpecs];
      newSpecs[index][field] = value;
      setTechSpecs(newSpecs);
  };
  const handleRemoveSpec = (index: number) => setTechSpecs(techSpecs.filter((_, i) => i !== index));

  const handleGenerateDescription = async () => {
    if (!form.name.trim()) {
        setMessage({ type: 'error', text: "Enter gadget name first!" });
        setTimeout(() => setMessage(null), 3000);
        return;
    }
    setIsGenerating(true);
    try {
        const res = await fetch('/api/admin/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: form.name, category: form.category }),
        });
        const data = await res.json();
        if (data.description) setForm(prev => ({ ...prev, description: data.description }));
    } finally {
        setIsGenerating(false);
    }
  };

  const startEditing = (product: Product) => {
    const vStock: Record<string, string> = {};
    if (product.variant_stock) Object.entries(product.variant_stock).forEach(([k, v]) => vStock[k] = v.toString());

    setForm({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || 'electronics',
      sku: product.sku || '',
      model_number: product.model_number || '',
      price: String(product.price ?? ''),
      cost_price: String(product.cost_price ?? ''),
      old_price: String(product.old_price ?? ''),
      description: product.description || '',
      short_description: product.short_description || '',
      what_is_in_the_box: product.what_is_in_the_box || '',
      sizes: Array.isArray(product.sizes) ? product.sizes.join(',') : 'Standard',
      stock: String(product.stock ?? '0'),
      low_stock_alert: String(product.low_stock_alert ?? '5'),
      warehouse_location: product.warehouse_location || '',
      sale_end_date: product.sale_end_date ? new Date(product.sale_end_date).toISOString().slice(0, 16) : '',
      featured_rank: String(product.featured_rank ?? '99'),
      is_featured: product.is_featured || false,
      is_best_seller: product.is_best_seller || false,
      allow_backorders: product.allow_backorders || false,
      hide_product: product.hide_product || false,
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      seo_keywords: Array.isArray(product.seo_keywords) ? product.seo_keywords.join(', ') : '',
      weight_kg: String(product.weight_kg ?? ''),
      length_cm: String(product.length_cm ?? ''),
      width_cm: String(product.width_cm ?? ''),
      height_cm: String(product.height_cm ?? ''),
    });

    setExistingImages(product.images || [product.image_url]);
    setVariantStock(vStock);
    setTechSpecs(product.tech_specs ? Object.entries(product.tech_specs).map(([key, value]) => ({ key, value })) : []);
    setVideoPreviewUrl(product.video_url || null);
    setEditingId(product.id);
    setFormSession(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(initialForm);
    setVariantStock({});
    setTechSpecs([]);
    setSelectedFiles([]);
    setExistingImages([]);
    setSelectedVideo(null);
    setVideoPreviewUrl(null);
    setFormSession(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !canManageInventory) return;
    if (!editingId && selectedFiles.length === 0) {
        setMessage({ type: 'error', text: 'Upload at least one photo.' });
        setTimeout(() => setMessage(null), 3000);
        return;
    }

    setIsSubmitting(true);

    try {
      let imageUrls = [...existingImages];
      let videoUrl = videoPreviewUrl || '';
      const BUCKET = 'apexstores-assets';

      if (selectedVideo) {
          if (!supabase) throw new Error("Database not connected");
          const path = `videos/${Date.now()}-${selectedVideo.name}`;
          await supabase.storage.from(BUCKET).upload(path, selectedVideo);
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
          videoUrl = data.publicUrl;
      }

      if (selectedFiles.length > 0 && supabase) {
          const client = supabase;
          const uploads = selectedFiles.map(async f => {
              const path = `products/${Date.now()}-${f.name}`;
              await client.storage.from(BUCKET).upload(path, f);
              return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          });
          const newUrls = await Promise.all(uploads);
          imageUrls = [...imageUrls, ...newUrls];
      }

      const vStock: Record<string, number> = {};
      currentVariants.forEach(v => vStock[v] = Number(variantStock[v] || 0));

      const specs: Record<string, string> = {};
      techSpecs.forEach(s => { if (s.key) specs[s.key] = s.value; });

      const productData = {
          name: form.name.trim(),
          brand: form.brand.trim(),
          price: Number(form.price),
          cost_price: Number(form.cost_price),
          old_price: Number(form.old_price) || null,
          description: form.description,
          short_description: form.short_description,
          what_is_in_the_box: form.what_is_in_the_box,
          image_url: imageUrls[0] || '',
          images: imageUrls,
          video_url: videoUrl,
          sizes: currentVariants,
          stock: Object.values(vStock).reduce((a, b) => a + b, 0),
          low_stock_alert: Number(form.low_stock_alert),
          warehouse_location: form.warehouse_location,
          variant_stock: vStock,
          tech_specs: specs,
          category: form.category,
          sale_end_date: form.sale_end_date || null,
          featured_rank: Number(form.featured_rank),
          sku: form.sku,
          model_number: form.model_number,
          is_featured: form.is_featured,
          is_best_seller: form.is_best_seller,
          allow_backorders: form.allow_backorders,
          hide_product: form.hide_product,
          seo_title: form.seo_title,
          seo_description: form.seo_description,
          seo_keywords: form.seo_keywords.split(',').map(k => k.trim()).filter(k => k),
          weight_kg: Number(form.weight_kg) || null,
          length_cm: Number(form.length_cm) || null,
          width_cm: Number(form.width_cm) || null,
          height_cm: Number(form.height_cm) || null,
      };

      if (editingId) {
          await supabase.from('products').update(productData).eq('id', editingId);
          await logAuditAction(email, 'UPDATE_PRODUCT', { id: editingId, name: productData.name });
      } else {
          await supabase.from('products').insert([productData]);
          await logAuditAction(email, 'CREATE_PRODUCT', { name: productData.name });
      }

      cancelEditing();
      fetchProducts();
      setMessage({ type: 'success', text: editingId ? 'Payload updated.' : 'Gadget deployed!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
        const error = err as Error;
        setMessage({ type: 'error', text: error.message });
        setTimeout(() => setMessage(null), 5000);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!supabase || !canManageInventory) return;

    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;

        await logAuditAction(email, 'DELETE_PRODUCT', { id, name });
        if (editingId === id) cancelEditing();
        fetchProducts();
        setMessage({ type: 'success', text: `${name} deleted.` });
        setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
        const error = err as Error;
        setMessage({ type: 'error', text: `Deletion failed: ${error.message}` });
        setTimeout(() => setMessage(null), 5000);
    }
  };

  const generateSupplierPO = () => {
    const low = products.filter(p => p.stock <= 5);
    const doc = new jsPDF();
    doc.text('Apexstores Purchase Order', 14, 20);
    autoTable(doc, { startY: 30, head: [['ID', 'Name', 'Stock']], body: low.map(p => [p.id, p.name, p.stock]) });
    doc.save('Apex_PO.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 text-left selection:bg-primary/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">

        {/* HEADER HUB */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Inventory Command</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                  {editingId ? 'Refine Gadget' : 'Stock Control'}
                </h1>
                <p className="text-slate-500 text-sm font-medium italic">Deploy premium tech payload to the global marketplace.</p>
            </div>

            {message && (
                <div className={cn(
                    "p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    <Layers className="h-5 w-5" />
                    <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="flex items-center gap-8 relative z-10">
                <div className="hidden sm:flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-slate-400">Readiness Score</span>
                        <span className="text-lg font-black text-primary">{formCompletion}%</span>
                    </div>
                    <div className="h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${formCompletion}%` }}></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={generateSupplierPO} className="h-12 px-6 rounded-xl border-slate-200 bg-white font-black uppercase text-[9px] tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm">
                        <Download className="h-3 w-3 mr-2" /> PO
                    </Button>
                    {editingId && (
                        <Button onClick={cancelEditing} variant="outline" className="h-12 px-6 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 font-black uppercase text-[9px]">Abort</Button>
                    )}
                </div>
            </div>
            <Layers className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-12 -z-0" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          <div className="lg:col-span-7 space-y-8">
            <form key={`form-v2-${editingId || 'new'}-${formSession}`} onSubmit={handleSubmit} className="space-y-8 pb-32">

              <Card className="rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden bg-white">
                  <button type="button" onClick={() => toggleSection('basic')} className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Info className="h-5 w-5" /></div>
                          <div className="text-left"><h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Basic Information</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identify tech payload specs</p></div>
                      </div>
                      {openSections.basic ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                  </button>
                  {openSections.basic && (
                      <CardContent className="p-10 pt-0 space-y-6">
                          <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Gadget Name</label><Input name="name" value={form.name} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold" required /></div>
                              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Brand</label><Input name="brand" value={form.brand} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50" /></div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Category</label>
                              <select name="category" value={form.category} onChange={handleInputChange} className="w-full h-14 rounded-2xl border-slate-100 bg-slate-50 px-4 text-xs font-black uppercase">
                                  {settings.catalog.categories.map(cat => (
                                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                                  ))}
                              </select></div>
                              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">SKU / ID</label><Input name="sku" value={form.sku} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-mono text-xs" /></div>
                          </div>
                      </CardContent>
                  )}
              </Card>

              {stockIntelligence && (
                  <Card className={cn(
                      "rounded-[3rem] border shadow-sm overflow-hidden bg-white animate-in zoom-in-95 duration-500",
                      stockIntelligence.isReorderUrgent ? "border-rose-100" : "border-slate-100"
                  )}>
                      <div className="p-8 flex items-center justify-between border-b border-slate-50">
                          <div className="flex items-center gap-4">
                              <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                  stockIntelligence.isReorderUrgent ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                              )}>
                                  <ProfitIcon className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                  <h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Stock Intelligence</h2>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Predictive Velocity Scan</p>
                              </div>
                          </div>
                          {stockIntelligence.isReorderUrgent && (
                              <span className="px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-full animate-pulse uppercase">REORDER URGENT</span>
                          )}
                      </div>
                      <CardContent className="p-10 space-y-8">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Current Stock</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.currentStock}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Avg Daily Sales</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.avgDailySales}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Days Remaining</p>
                                  <p className={cn(
                                      "text-2xl font-black",
                                      stockIntelligence.isReorderUrgent ? "text-rose-600" : "text-emerald-600"
                                  )}>{stockIntelligence.daysRemaining}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Reorder Point</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.reorderPoint}</p>
                              </div>
                          </div>

                          <div className="flex gap-4">
                              <Button type="button" onClick={generateSupplierPO} className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                                  <Download className="h-4 w-4 mr-2" /> Create Purchase Order
                              </Button>
                              <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest">
                                  Modify Threshold
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              )}

              <Card className="rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden bg-white">
                  <button type="button" onClick={() => toggleSection('pricing')} className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><DollarSign className="h-5 w-5" /></div>
                          <div className="text-left"><h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Pricing Hub</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Financial & Margin control</p></div>
                      </div>
                      {openSections.pricing ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                  </button>
                  {openSections.pricing && (
                      <CardContent className="p-10 pt-0 space-y-8">
                          <div className="grid sm:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase text-slate-400">Current Selling Price</label>
                                  <Input name="price" type="number" value={form.price} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-lg" required />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase text-slate-400">Original Price (Slashed)</label>
                                  <Input name="old_price" type="number" value={form.old_price} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-lg" placeholder="1500" />
                                  <p className="text-[7px] font-bold text-slate-400 uppercase mt-1 px-1">Leave empty if not on sale</p>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase text-slate-400">Inventory Cost</label>
                                  <Input name="cost_price" type="number" value={form.cost_price} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-lg" />
                              </div>
                          </div>
                          <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem] text-primary flex justify-between items-center relative overflow-hidden shadow-inner">
                              <div className="relative z-10 flex gap-12 text-left">
                                  <div><p className="text-[8px] font-black uppercase text-primary/60 mb-1">Net Unit Profit</p><p className={cn("text-3xl font-black", profitIntel.profit > 0 ? "text-primary" : "text-rose-600")}>{formatPrice(profitIntel.profit)}</p></div>
                                  <div><p className="text-[8px] font-black uppercase text-primary/60 mb-1">Margin</p><p className="text-3xl font-black text-primary">{profitIntel.margin.toFixed(1)}%</p></div>
                              </div>
                              <ProfitIcon className="absolute -bottom-6 -right-6 h-32 w-32 text-primary/5 rotate-12" />
                          </div>
                      </CardContent>
                  )}
              </Card>

              {stockIntelligence && (
                  <Card className={cn(
                      "rounded-[3rem] border shadow-sm overflow-hidden bg-white animate-in zoom-in-95 duration-500",
                      stockIntelligence.isReorderUrgent ? "border-rose-100" : "border-slate-100"
                  )}>
                      <div className="p-8 flex items-center justify-between border-b border-slate-50">
                          <div className="flex items-center gap-4">
                              <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                  stockIntelligence.isReorderUrgent ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                              )}>
                                  <ProfitIcon className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                  <h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Stock Intelligence</h2>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Predictive Velocity Scan</p>
                              </div>
                          </div>
                          {stockIntelligence.isReorderUrgent && (
                              <span className="px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-full animate-pulse uppercase">REORDER URGENT</span>
                          )}
                      </div>
                      <CardContent className="p-10 space-y-8">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Current Stock</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.currentStock}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Avg Daily Sales</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.avgDailySales}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Days Remaining</p>
                                  <p className={cn(
                                      "text-2xl font-black",
                                      stockIntelligence.isReorderUrgent ? "text-rose-600" : "text-emerald-600"
                                  )}>{stockIntelligence.daysRemaining}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Reorder Point</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.reorderPoint}</p>
                              </div>
                          </div>

                          <div className="flex gap-4">
                              <Button type="button" onClick={generateSupplierPO} className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                                  <Download className="h-4 w-4 mr-2" /> Create Purchase Order
                              </Button>
                              <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest">
                                  Modify Threshold
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              )}

              <Card className="rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden bg-white">
                  <button type="button" onClick={() => toggleSection('inventory')} className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><PackageCheck className="h-5 w-5" /></div>
                          <div className="text-left"><h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Inventory</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Multi-dimensional Stock</p></div>
                      </div>
                      {openSections.inventory ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                  </button>
                  {openSections.inventory && (
                      <CardContent className="p-10 pt-0 space-y-8">
                          <div className="grid sm:grid-cols-2 gap-6 text-left">
                              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Low Stock Alert</label><Input name="low_stock_alert" type="number" value={form.low_stock_alert} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50" /></div>
                              <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Warehouse Shelf</label><Input name="warehouse_location" value={form.warehouse_location} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-100 bg-slate-50 uppercase font-black" /></div>
                          </div>
                          <div className="space-y-4 pt-4 border-t border-slate-50 text-left">
                              <label className="text-[9px] font-black uppercase text-slate-400">Variant Attributes (Comma Separated)</label>
                              <Input name="sizes" value={form.sizes} onChange={handleInputChange} placeholder="White, Black, 128GB..." className="h-14 rounded-2xl border-slate-100 bg-slate-50" />
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                                  {currentVariants.map(v => (
                                      <div key={v} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                          <label className="text-[8px] font-black uppercase text-slate-400 block truncate">{v}</label>
                                          <Input type="number" value={variantStock[v] || ''} onChange={e => handleVariantStockChange(v, e.target.value)} className="h-10 rounded-xl bg-white text-xs font-black" />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </CardContent>
                  )}
              </Card>

              {stockIntelligence && (
                  <Card className={cn(
                      "rounded-[3rem] border shadow-sm overflow-hidden bg-white animate-in zoom-in-95 duration-500",
                      stockIntelligence.isReorderUrgent ? "border-rose-100" : "border-slate-100"
                  )}>
                      <div className="p-8 flex items-center justify-between border-b border-slate-50">
                          <div className="flex items-center gap-4">
                              <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                  stockIntelligence.isReorderUrgent ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                              )}>
                                  <ProfitIcon className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                  <h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Stock Intelligence</h2>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Predictive Velocity Scan</p>
                              </div>
                          </div>
                          {stockIntelligence.isReorderUrgent && (
                              <span className="px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-full animate-pulse uppercase">REORDER URGENT</span>
                          )}
                      </div>
                      <CardContent className="p-10 space-y-8">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Current Stock</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.currentStock}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Avg Daily Sales</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.avgDailySales}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Days Remaining</p>
                                  <p className={cn(
                                      "text-2xl font-black",
                                      stockIntelligence.isReorderUrgent ? "text-rose-600" : "text-emerald-600"
                                  )}>{stockIntelligence.daysRemaining}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Reorder Point</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.reorderPoint}</p>
                              </div>
                          </div>

                          <div className="flex gap-4">
                              <Button type="button" onClick={generateSupplierPO} className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                                  <Download className="h-4 w-4 mr-2" /> Create Purchase Order
                              </Button>
                              <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest">
                                  Modify Threshold
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              )}

              <Card className="rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden bg-white">
                  <button type="button" onClick={() => toggleSection('description')} className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><FileText className="h-5 w-5" /></div>
                          <div className="text-left"><h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Content Hub</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Storytelling & Specs</p></div>
                      </div>
                      {openSections.description ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                  </button>
                  {openSections.description && (
                      <CardContent className="p-10 pt-0 space-y-8 text-left">
                          <div className="space-y-4">
                              <div className="flex justify-between items-center"><label className="text-[9px] font-black uppercase text-slate-400">Short Hook</label><Button type="button" onClick={handleGenerateDescription} disabled={isGenerating} variant="ghost" className="h-8 rounded-xl text-[8px] font-black uppercase text-primary border border-primary/20"><Sparkles className="h-3 w-3 mr-1" /> AI Write</Button></div>
                              <Input name="short_description" value={form.short_description} onChange={handleInputChange} className="h-14 rounded-2xl bg-slate-50 border-slate-100 italic" />
                          </div>
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Full Mission Narrative</label><Textarea name="description" value={form.description} onChange={handleInputChange} rows={6} className="rounded-[2rem] bg-slate-50 border-slate-100 p-6 text-sm" /></div>
                          <div className="space-y-6">
                              <div className="flex justify-between items-center"><h3 className="text-[10px] font-black uppercase text-foreground">Technical Specifications</h3><Button type="button" onClick={handleAddSpec} variant="outline" className="h-8 rounded-lg text-[8px] font-black uppercase"><Plus className="h-3 w-3 mr-1" /> Add Spec</Button></div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{techSpecs.map((s, i) => (
                                  <div key={i} className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                      <input value={s.key} onChange={e => handleSpecChange(i, 'key', e.target.value)} placeholder="Key" className="bg-transparent text-[10px] font-black uppercase w-1/2 outline-none" />
                                      <input value={s.value} onChange={e => handleSpecChange(i, 'value', e.target.value)} placeholder="Value" className="bg-transparent text-[10px] font-bold text-slate-500 w-1/2 border-l border-slate-200 pl-3 outline-none" />
                                      <button type="button" onClick={() => handleRemoveSpec(i)} className="text-slate-200 hover:text-rose-500"><X className="h-3 w-3" /></button>
                                  </div>
                              ))}</div>
                          </div>
                      </CardContent>
                  )}
              </Card>

              {stockIntelligence && (
                  <Card className={cn(
                      "rounded-[3rem] border shadow-sm overflow-hidden bg-white animate-in zoom-in-95 duration-500",
                      stockIntelligence.isReorderUrgent ? "border-rose-100" : "border-slate-100"
                  )}>
                      <div className="p-8 flex items-center justify-between border-b border-slate-50">
                          <div className="flex items-center gap-4">
                              <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                  stockIntelligence.isReorderUrgent ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                              )}>
                                  <ProfitIcon className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                  <h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Stock Intelligence</h2>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Predictive Velocity Scan</p>
                              </div>
                          </div>
                          {stockIntelligence.isReorderUrgent && (
                              <span className="px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-full animate-pulse uppercase">REORDER URGENT</span>
                          )}
                      </div>
                      <CardContent className="p-10 space-y-8">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Current Stock</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.currentStock}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Avg Daily Sales</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.avgDailySales}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Days Remaining</p>
                                  <p className={cn(
                                      "text-2xl font-black",
                                      stockIntelligence.isReorderUrgent ? "text-rose-600" : "text-emerald-600"
                                  )}>{stockIntelligence.daysRemaining}</p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Reorder Point</p>
                                  <p className="text-2xl font-black text-foreground">{stockIntelligence.reorderPoint}</p>
                              </div>
                          </div>

                          <div className="flex gap-4">
                              <Button type="button" onClick={generateSupplierPO} className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                                  <Download className="h-4 w-4 mr-2" /> Create Purchase Order
                              </Button>
                              <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest">
                                  Modify Threshold
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              )}

              <Card className="rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden bg-white">
                  <button type="button" onClick={() => toggleSection('media')} className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><ImageIcon className="h-5 w-5" /></div>
                          <div className="text-left"><h2 className="text-lg font-black text-foreground uppercase tracking-tighter">Media Hub</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visual Assets & Video</p></div>
                      </div>
                      {openSections.media ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                  </button>
                  {openSections.media && (
                      <CardContent className="p-10 pt-0 space-y-8 text-left">
                          <div className="space-y-4">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Product Images (Gallery)</label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  {/* Existing Images */}
                                  {existingImages.map((url, idx) => (
                                      <div key={`existing-${idx}`} className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden group">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={url} alt="" className="w-full h-full object-contain" />
                                          <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                                      </div>
                                  ))}
                                  {/* New Files */}
                                  {selectedFiles.map((file, idx) => (
                                      <div key={`new-${idx}`} className="relative aspect-square rounded-2xl bg-primary/5 border border-primary/20 overflow-hidden group">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-contain" />
                                          <button type="button" onClick={() => removeNewFile(idx)} className="absolute top-2 right-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                                          <div className="absolute bottom-1 left-1 right-1 bg-primary text-white text-[6px] font-bold text-center rounded py-0.5">NEW</div>
                                      </div>
                                  ))}
                                  {/* Upload Button */}
                                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-slate-300 hover:text-primary group">
                                      <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                      <Camera className="h-6 w-6" />
                                      <span className="text-[8px] font-black uppercase">Add Photo</span>
                                  </label>
                              </div>
                          </div>

                          <div className="space-y-4 pt-6 border-t border-slate-50">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Product Video (UHD/MP4)</label>
                              <div className="flex gap-4">
                                  <label className="flex-1 h-14 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-slate-300 hover:text-indigo-600">
                                      <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) setSelectedVideo(f); }} className="hidden" />
                                      <Plus className="h-4 w-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{selectedVideo ? selectedVideo.name : 'Select Tactical Video'}</span>
                                  </label>
                                  {selectedVideo && <Button type="button" onClick={() => setSelectedVideo(null)} variant="ghost" className="h-14 w-14 rounded-2xl text-rose-500 bg-rose-50"><X className="h-5 w-5" /></Button>}
                              </div>
                          </div>
                      </CardContent>
                  )}
              </Card>

              <div className="sticky bottom-10 z-[50] animate-in slide-in-from-bottom-6 duration-1000">
                  <div className="bg-slate-50 p-4 rounded-[2.5rem] shadow-2xl flex gap-3 border border-slate-200">
                      {editingId && products.find(p => p.id === editingId)?.status === 'Pending' && (
                          <Button
                              type="button"
                              onClick={async () => {
                                  if(!supabase) return;
                                  setIsSubmitting(true);
                                  await supabase.from('products').update({ status: 'Live' }).eq('id', editingId);
                                  cancelEditing();
                                  fetchProducts();
                                  setMessage({ type: 'success', text: 'Gadget Authorized for Grid! ✅' });
                                  setIsSubmitting(false);
                              }}
                              className="h-16 px-8 rounded-2xl bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95"
                          >
                              Authorize for Grid
                          </Button>
                      )}
                      <Button type="submit" disabled={isSubmitting} className="flex-1 h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Rocket className="h-5 w-5 mr-3" />}
                        {editingId ? 'Save Product Changes' : 'Deploy New Gadget'}
                      </Button>
                      {editingId && <Button type="button" onClick={cancelEditing} variant="ghost" className="h-16 px-10 rounded-2xl text-slate-400 hover:text-foreground hover:bg-white font-black uppercase text-[10px] active:scale-95 transition-all">Abort</Button>}
                  </div>
              </div>

            </form>
          </div>

          <div className="lg:col-span-5 space-y-10">
              <div className="sticky top-8 space-y-8">
                  <div className="flex items-center justify-between px-4"><h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Payload Preview</h3><div className="px-3 py-1.5 rounded-lg bg-white border border-slate-100 shadow-sm text-[9px] font-black text-primary flex items-center gap-2"><Smartphone className="h-3 w-3" /> Live Mobile</div></div>
                  <div className="w-[320px] h-[640px] bg-white rounded-[3.5rem] border-[12px] border-slate-100 mx-auto shadow-2xl relative overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.02] origin-top scale-90 xl:scale-100">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-100 rounded-b-2xl z-20"></div>
                        <div className="flex-1 overflow-y-auto pt-10 pb-20 no-scrollbar">
                            <div className="p-6 space-y-6">
                                <div className="aspect-square bg-slate-50 rounded-3xl border border-slate-100 p-8 flex items-center justify-center relative overflow-hidden">
                                    {(selectedFiles.length > 0 || existingImages.length > 0) ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={selectedFiles.length > 0 ? URL.createObjectURL(selectedFiles[0]) : existingImages[0]} className="max-h-full w-auto object-contain relative z-10" alt="" />
                                    ) : <ImageIcon className="h-10 w-10 text-slate-200" />}
                                    <div className="absolute top-4 left-4 flex flex-col gap-1">
                                        {form.is_featured && <span className="px-2 py-0.5 bg-primary text-white text-[7px] font-black uppercase rounded-full shadow-lg">Featured</span>}
                                        {form.old_price && Number(form.old_price) > Number(form.price) && <span className="px-2 py-0.5 bg-rose-500 text-white text-[7px] font-black uppercase rounded-full shadow-lg">Sale</span>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black uppercase text-primary tracking-widest">{form.brand || 'Apexstores'}</p>
                                    <h4 className="text-xl font-black uppercase text-foreground tracking-tighter leading-none truncate">{form.name || 'Gadget Title'}</h4>
                                    <p className="text-2xl font-black text-foreground tracking-tighter">{formatPrice(Number(form.price) || 0)}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium italic line-clamp-3">&quot;{form.short_description || form.description || 'Manuscript pending...'}&quot;</p>
                                <div className="space-y-2">
                                    <Button className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Add to Bag</Button>
                                    <Button variant="outline" className="w-full h-10 rounded-2xl border-primary/20 text-primary font-black uppercase text-[8px] tracking-widest">Buy via WhatsApp</Button>
                                </div>
                            </div>
                        </div>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                          <div className="flex flex-col gap-4">
                              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Inventory Feed</h2>
                              <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100 w-fit">
                                  <button onClick={() => setActiveTab('live')} className={cn("px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all", activeTab === 'live' ? "bg-white text-foreground shadow-sm" : "text-slate-400")}>Active Grid</button>
                                  <button onClick={() => setActiveTab('proposals')} className={cn("px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all", activeTab === 'proposals' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400")}>Proposals</button>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <Button onClick={cancelEditing} variant="ghost" size="sm" className="h-8 rounded-lg bg-primary/5 text-primary text-[8px] font-black uppercase hover:bg-primary hover:text-white"><Plus className="h-3 w-3 mr-1" /> New</Button>
                              <button onClick={fetchProducts} className="text-slate-300 hover:text-primary transition-colors">
                                  <RefreshCcw className={cn("h-4 w-4", loadingProducts && "animate-spin")} />
                              </button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 no-scrollbar">
                          {products.filter(p => activeTab === 'live' ? (p.status !== 'Pending') : (p.status === 'Pending')).map(p => (
                                <div key={p.id} className={cn(
                                    "h-24 w-full hover:bg-slate-50 group flex items-center justify-between cursor-pointer p-6 transition-all",
                                    editingId === p.id && "bg-primary/5 border-l-4 border-primary"
                                )} onClick={() => startEditing(p)}>
                                  <div className="flex items-center gap-4 min-w-0">
                                      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={p.image_url} className="max-h-full w-auto object-contain" alt="" />
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-[11px] font-black text-foreground uppercase truncate leading-none mb-1">{p.name}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.stock} Units • {p.category}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, p.name); }}
                                        className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                          <Trash2 className="h-4 w-4" />
                                      </button>
                                      <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
