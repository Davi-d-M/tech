'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    Rocket,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Camera as InstagramIcon,
    Share2 as Facebook,
    MessageCircle,
    Mail,
    Loader2,
    Smartphone,
    CheckCircle2,
    Calendar,
    Activity as Zap,
    Users,
    Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { useSettings } from '@/lib/useSettings';
import Image from 'next/image';
import InstagramPreview from '@/components/admin/marketing/InstagramPreview';
import WhatsAppPreview from '@/components/admin/marketing/WhatsAppPreview';
import EmailPreview from '@/components/admin/marketing/EmailPreview';

type Step = 'context' | 'content' | 'preview' | 'audience';

export default function CreateCampaign() {
    const { email } = useAdmin();
    const { settings } = useSettings();
    const [step, setStep] = React.useState<Step>('context');
    const [loading, setLoading] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [activePreview, setActivePreview] = React.useState<'instagram' | 'whatsapp' | 'email'>('instagram');
    const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Campaign State
    const [campaign, setCampaign] = React.useState({
        name: '',
        type: 'Product Launch',
        product_id: '',
        status: 'Draft',
        scheduled_at: '',
        audience_id: 'all'
    });

    const [products, setProducts] = React.useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
    const [segments, setSegments] = React.useState<any[]>([
        { id: 'all', name: 'Everyone', estimated_reach: 2481 },
        { id: 'vip', name: 'Elite VIPs', estimated_reach: 184 },
        { id: 'inactive', name: 'Inactive 30d', estimated_reach: 312 }
    ]);

    // Channel Content State
    const [channels, setChannels] = React.useState({
        instagram: { active: true, caption: '', generated: false },
        whatsapp: { active: true, body: '', generated: false },
        email: { active: true, subject: '', body: '', generated: false }
    });

    React.useEffect(() => {
        async function fetchData() {
            if (!supabase) return;
            const [prodRes, segRes] = await Promise.all([
                supabase.from('products').select('*').order('name'),
                supabase.from('customer_segments').select('*')
            ]);
            if (prodRes.data) setProducts(prodRes.data);
            if (segRes.data && segRes.data.length > 0) setSegments(segRes.data);
        }
        fetchData();
    }, []);

    const handleProductSelect = (id: string) => {
        const prod = products.find(p => p.id === Number(id));
        setSelectedProduct(prod);
        setCampaign(prev => ({ ...prev, product_id: id }));
    };

    const generateContent = async () => {
        if (!selectedProduct) return;
        setIsGenerating(true);
        // Simulated AI Generation
        setTimeout(() => {
            setChannels(prev => ({
                ...prev,
                instagram: { ...prev.instagram, caption: `🚀 NEW ARRIVAL: ${selectedProduct.name} has landed! \n\nElevate your setup with our latest ${selectedProduct.category} essential. Engineered for high-fidelity performance. \n\nPrice: ${formatPrice(selectedProduct.price)} \nShop now at the link in bio! 🔗`, generated: true },
                whatsapp: { ...prev.whatsapp, body: `*Tactical Alert* 🚨\n\nYo bro! The new *${selectedProduct.name}* is officially live. \n\nLimited stock available for our elite members. \n\n🛒 *Price:* ${formatPrice(selectedProduct.price)}\n📍 Nairobi Fast Dispatch Active\n\nLink: tech-paxv.onrender.com/product/${selectedProduct.id}`, generated: true },
                email: { ...prev.email, subject: `Tactical Drop: ${selectedProduct.name} is Live 🚀`, body: `Hello Elite member,\n\nThe next evolution in tech has arrived. Discover the ${selectedProduct.name}.`, generated: true }
            }));
            setIsGenerating(false);
            setStep('content');
        }, 1500);
    };

    const launchCampaign = async () => {
        if (!supabase) return;
        setLoading(true);
        setMessage(null);
        try {
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .insert([{
                    name: campaign.name,
                    type: campaign.type,
                    product_id: Number(campaign.product_id),
                    status: campaign.scheduled_at ? 'Scheduled' : 'Published',
                    scheduled_at: campaign.scheduled_at || null,
                    created_by: email
                }])
                .select()
                .single();

            if (error) throw error;

            // Insert channels
            const channelData = [
                { campaign_id: data.id, channel: 'Instagram', content: channels.instagram },
                { campaign_id: data.id, channel: 'WhatsApp', content: channels.whatsapp },
                { campaign_id: data.id, channel: 'Email', content: { subject: channels.email.subject, body: channels.email.body } }
            ];

            await supabase.from('campaign_channels').insert(channelData);

            setMessage({ type: 'success', text: "Mission initiated successfully! Redirecting..." });
            setTimeout(() => {
                window.location.href = '/admin/marketing/list';
            }, 2000);
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: 'error', text: error.message || "Failed to launch campaign." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left pb-40">
            {/* Wizard Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div className="space-y-4">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft size={14} /> Cancel Mission
                    </button>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Campaign Builder</h1>
                    <div className="flex gap-2">
                        {['context', 'content', 'preview', 'audience'].map((s, idx) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={cn(
                                    "h-1.5 w-8 rounded-full transition-all duration-500",
                                    step === s ? "bg-primary w-16" : idx < ['context', 'content', 'preview', 'audience'].indexOf(step) ? "bg-primary/40" : "bg-secondary"
                                )}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2.5rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <Zap size={24} />}
                    <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">

                    {/* STEP 1: CONTEXT */}
                    {step === 'context' && (
                        <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-10 animate-in fade-in slide-in-from-left-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Package size={18} /></div>
                                <h2 className="text-xl font-black uppercase text-foreground">Mission Context</h2>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Campaign Name</label>
                                    <Input
                                        value={campaign.name}
                                        onChange={e => setCampaign({...campaign, name: e.target.value})}
                                        placeholder="e.g. AMAYA AM-05 Launch"
                                        className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Campaign Type</label>
                                    <select
                                        value={campaign.type}
                                        onChange={e => setCampaign({...campaign, type: e.target.value})}
                                        className="w-full h-14 rounded-2xl bg-secondary border border-border px-4 text-[10px] font-black uppercase text-foreground outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option>Product Launch</option>
                                        <option>Sale</option>
                                        <option>Restock</option>
                                        <option>Flash Sale</option>
                                    </select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Tactical Payload (Product)</label>
                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {products.slice(0, 5).map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleProductSelect(p.id)}
                                                className={cn(
                                                    "p-4 rounded-2xl border text-left transition-all flex gap-3 items-center",
                                                    campaign.product_id === String(p.id) ? "bg-primary/5 border-primary shadow-sm" : "bg-secondary border-border hover:border-muted text-muted-foreground"
                                                )}
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-white overflow-hidden relative shrink-0">
                                                    {p.image_url && <Image src={p.image_url} fill className="object-contain" alt="" />}
                                                </div>
                                                <span className="text-[9px] font-black uppercase leading-tight truncate">{p.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border flex justify-end">
                                <Button
                                    onClick={generateContent}
                                    disabled={!campaign.name || !selectedProduct || isGenerating}
                                    className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                >
                                    {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Syncing AI Assistant...</> : <><Sparkles size={16} className="mr-2" /> Generate Tactical Content</>}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* STEP 2: CONTENT ASSISTANT */}
                    {step === 'content' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Sparkles size={18} /></div>
                                        <h2 className="text-xl font-black uppercase text-foreground">Content Assistant</h2>
                                    </div>
                                    <Button variant="outline" onClick={() => setStep('context')} className="h-10 rounded-xl text-[8px] font-black uppercase">Change Context</Button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-2 text-primary font-black uppercase text-[10px] tracking-widest">
                                            <InstagramIcon size={14} /> Social Meta (IG/FB)
                                        </div>
                                        <Textarea
                                            value={channels.instagram.caption}
                                            onChange={e => setChannels({...channels, instagram: {...channels.instagram, caption: e.target.value}})}
                                            rows={5}
                                            className="rounded-[1.5rem] bg-secondary border-border p-6 text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-2 text-emerald-500 font-black uppercase text-[10px] tracking-widest">
                                            <MessageCircle size={14} /> WhatsApp Direct
                                        </div>
                                        <Textarea
                                            value={channels.whatsapp.body}
                                            onChange={e => setChannels({...channels, whatsapp: {...channels.whatsapp, body: e.target.value}})}
                                            rows={5}
                                            className="rounded-[1.5rem] bg-secondary border-border p-6 text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-2 text-indigo-500 font-black uppercase text-[10px] tracking-widest">
                                            <Mail size={14} /> Tactical Email
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                value={channels.email.subject}
                                                onChange={e => setChannels({...channels, email: {...channels.email, subject: e.target.value}})}
                                                placeholder="Subject Line"
                                                className="h-12 rounded-xl bg-secondary border-border text-xs font-bold"
                                            />
                                            <Textarea
                                                value={channels.email.body}
                                                onChange={e => setChannels({...channels, email: {...channels.email, body: e.target.value}})}
                                                rows={4}
                                                className="rounded-[1.5rem] bg-secondary border-border p-6 text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end">
                                    <Button
                                        onClick={() => setStep('preview')}
                                        className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        Inspect Previews <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 'preview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Zap size={18} /></div>
                                        <h2 className="text-xl font-black uppercase text-foreground">Tactical Preview</h2>
                                    </div>
                                    <div className="flex gap-2 p-1 bg-secondary rounded-xl border border-border">
                                        {(['instagram', 'whatsapp', 'email'] as const).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setActivePreview(p)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all",
                                                    activePreview === p ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="py-10 bg-slate-50 rounded-[2.5rem] border border-dashed border-border min-h-[600px] flex items-center justify-center">
                                    {activePreview === 'instagram' && (
                                        <InstagramPreview
                                            productName={selectedProduct.name}
                                            imageUrl={selectedProduct.image_url}
                                            caption={channels.instagram.caption}
                                        />
                                    )}
                                    {activePreview === 'whatsapp' && (
                                        <WhatsAppPreview
                                            imageUrl={selectedProduct.image_url}
                                            body={channels.whatsapp.body}
                                        />
                                    )}
                                    {activePreview === 'email' && (
                                        <EmailPreview
                                            productName={selectedProduct.name}
                                            productPrice={selectedProduct.price}
                                            imageUrl={selectedProduct.image_url}
                                            subject={channels.email.subject}
                                            body={channels.email.body}
                                        />
                                    )}
                                </div>

                                <div className="pt-6 border-t border-border flex justify-between">
                                    <Button variant="outline" onClick={() => setStep('content')} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px]">Back to Content</Button>
                                    <Button
                                        onClick={() => setStep('audience')}
                                        className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        Target Audience <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* STEP 4: AUDIENCE & SCHEDULE */}
                    {step === 'audience' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Users size={18} /></div>
                                    <h2 className="text-xl font-black uppercase text-foreground">Final Deployment</h2>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dispatch Audience</label>
                                            <div className="space-y-3">
                                                {segments.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => setCampaign({...campaign, audience_id: s.id})}
                                                        className={cn(
                                                            "w-full p-6 rounded-3xl border transition-all text-left flex items-center justify-between group",
                                                            campaign.audience_id === s.id ? "bg-primary/5 border-primary shadow-sm" : "bg-secondary border-border hover:border-muted"
                                                        )}
                                                    >
                                                        <div>
                                                            <p className={cn("text-sm font-black uppercase tracking-tight", campaign.audience_id === s.id ? "text-primary" : "text-foreground")}>{s.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.estimated_reach.toLocaleString()} Shoppers</p>
                                                        </div>
                                                        <div className={cn(
                                                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                            campaign.audience_id === s.id ? "border-primary bg-primary text-white" : "border-slate-200"
                                                        )}>
                                                            {campaign.audience_id === s.id && <CheckCircle2 size={14} />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Schedule Timing</label>
                                            <div className="bg-secondary p-8 rounded-[2.5rem] border border-border space-y-6">
                                                <div className="flex items-center gap-3 text-primary">
                                                    <Calendar size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Clock</span>
                                                </div>
                                                <Input
                                                    type="datetime-local"
                                                    value={campaign.scheduled_at}
                                                    onChange={e => setCampaign({...campaign, scheduled_at: e.target.value})}
                                                    className="h-14 rounded-2xl bg-white border-border font-black text-xs uppercase"
                                                />
                                                <p className="text-[8px] font-medium text-slate-400 italic">Leave empty for instant tactical dispatch across all selected channels.</p>
                                            </div>
                                        </div>

                                        <Card className="p-8 rounded-[2.5rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden">
                                            <div className="relative z-10 space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Rocket size={16} className="text-primary animate-pulse" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Ready for Launch</p>
                                                </div>
                                                <p className="text-xs font-medium leading-relaxed italic opacity-70">Once you initiate the campaign, our AI and channel routers will begin the multi-platform synchronization.</p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-between">
                                    <Button variant="outline" onClick={() => setStep('preview')} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px]">Back to Preview</Button>
                                    <Button
                                        onClick={launchCampaign}
                                        disabled={loading}
                                        className="h-14 px-12 rounded-2xl bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        {loading ? <><Loader2 size={18} className="animate-spin mr-3" /> Engaging...</> : <><Rocket size={18} className="mr-3" /> Initiate Launch</>}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                </div>

                {/* Right Sidebar: Dynamic Intelligence */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-10 rounded-[3rem] bg-foreground text-background border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-6 text-left">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Payload Specs</h3>
                            {selectedProduct ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-white/10 p-2 overflow-hidden relative">
                                            <Image src={selectedProduct.image_url} fill className="object-contain" alt="" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-primary uppercase leading-none mb-1">Target Device</p>
                                            <p className="text-sm font-black text-white uppercase tracking-tight leading-tight">{selectedProduct.name}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[8px] font-black text-background/50 uppercase mb-1">Price</p>
                                            <p className="text-lg font-black text-white">{formatPrice(selectedProduct.price)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[8px] font-black text-background/50 uppercase mb-1">Stock</p>
                                            <p className="text-lg font-black text-white">{selectedProduct.stock} U</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-background/40 italic">Select a product to view tactical specifications.</p>
                            )}
                        </div>
                        <Zap className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/10 rotate-12 -z-0" />
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-white border border-border shadow-sm space-y-4 text-left">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Users size={18} /></div>
                        <h4 className="text-lg font-black uppercase text-foreground leading-none">Audience Drill</h4>
                        <p className="text-[10px] text-muted-foreground font-medium italic">
                            &quot;Selecting the VIP segment for this launch will target 184 high-value shoppers with a 42% average conversion rate.&quot;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
