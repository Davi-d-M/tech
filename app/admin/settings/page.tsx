'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';
import {
    Phone,
    Palette,
    Truck,
    Save,
    RefreshCcw,
    CheckCircle2,
    Zap,
    Loader2,
    ShieldAlert,
    Globe,
    Image as ImageIcon,
    Eye,
    Code,
    Clock,
    Lock,
    Unlock,
    Activity,
    Info,
    Smartphone,
    Share2,
    Camera,
    Rocket,
    Trash2,
    Plus,
    DollarSign,
    Home as HomeIcon,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DEFAULTS = {
    contact: { whatsapp: "254769345599", email: "support@apexstores.com", address: "Nairobi, Kenya" },
    branding: { owner_name: "Apex Master", portfolio_url: "https://apexstores.co.ke", hero_title: "Future Sound. Total Power.", hero_subtitle: "Experience authentic tech engineered for excellence.", logo_url: "", favicon_url: "" },
    homepage: { hero_image_url: "", hero_starting_price: 4500, hero_badge_text: "The New Era of Tech is Here", hero_visual_label: "Apex Premium Series" },
    shipping: { nairobi_cbd_label: "Nairobi CBD / Local", nairobi_cbd: 0, nairobi_outskirts_label: "Nairobi Outskirts", nairobi_outskirts: 300, upcountry_label: "Upcountry / Major Towns", upcountry: 500 },
    logistics: { dispatch_zones: ["CBD", "Westlands", "Kilimani", "Lavington", "Kileleshwa", "Karen", "Langata", "South C", "South B", "Embakasi", "Roysambu", "Kasarani", "Kahawa", "Githurai", "Zimmerman", "Utawala", "Syokimau", "Kitengela", "Rongai", "Ngong", "Kikuyu", "Thika Road", "Mombasa Road"] },
    catalog: { categories: [{ id: 'airpods', label: 'Elite Audio' }, { id: 'chargers', label: 'Super Chargers' }, { id: 'cases', label: 'Cases' }, { id: 'watches', label: 'Watches' }, { id: 'accessories', label: 'Others' }] },
    promotions: { flash_sale_text: 'Flash Sale: 20% OFF All Tech!', discount_percent: 20, is_active: true, flash_sale_end: '' },
    theme_config: { primary: "#F5A000", secondary: "#0F172A", accent: "#F5A000", custom_css: "" },
    seo_config: { title: "Apexstores | Elite Tech", description: "Premium tech store in Nairobi.", keywords: "AirPods, Chargers, iPhone", og_image: "" },
    social_links: { instagram: "", tiktok: "", facebook: "", x: "", youtube: "" },
    store_info: { name: "APEXSTORES", hours: "9am - 6pm", google_maps: "", footer_copy: "© 2026 Apexstores™" }
};

type TabId = 'identity' | 'homepage' | 'theme' | 'seo' | 'ops' | 'catalog' | 'advanced';

export default function AdminSettingsPage() {
    const { email } = useAdmin();
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [contact, setContact] = useState(DEFAULTS.contact);
    const [branding, setBranding] = useState(DEFAULTS.branding);
    const [homepage, setHomepage] = useState(DEFAULTS.homepage);
    const [shipping, setShipping] = useState(DEFAULTS.shipping);
    const [logistics, setLogistics] = useState(DEFAULTS.logistics);
    const [catalog, setCatalog] = useState(DEFAULTS.catalog);
    const [promotions, setPromotions] = useState(DEFAULTS.promotions);
    const [theme, setTheme] = useState(DEFAULTS.theme_config);
    const [seo, setSeo] = useState(DEFAULTS.seo_config);
    const [social, setSocial] = useState(DEFAULTS.social_links);
    const [store, setStore] = useState(DEFAULTS.store_info);

    const [activeTab, setActiveTab] = useState<TabId>('identity');
    const [isAdvancedEnabled, setIsAdvancedEnabled] = useState(false);
    const [isSandboxMode, setIsSandboxMode] = useState(false);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [heroPreview, setHeroPreview] = useState<string | null>(null);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const heroInputRef = useRef<HTMLInputElement>(null);

    const fetchSettings = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('settings').select('*');
            if (data && data.length > 0) {
                data.forEach((item: { key: string; value: unknown }) => {
                    if (item.key === 'contact') setContact(item.value as typeof DEFAULTS.contact);
                    if (item.key === 'branding') {
                        setBranding(item.value as typeof DEFAULTS.branding);
                        const val = item.value as typeof DEFAULTS.branding;
                        if (val.logo_url) setLogoPreview(val.logo_url);
                        if (val.favicon_url) setFaviconPreview(val.favicon_url);
                    }
                    if (item.key === 'homepage') {
                        setHomepage(item.value as typeof DEFAULTS.homepage);
                        const val = item.value as typeof DEFAULTS.homepage;
                        if (val.hero_image_url) setHeroPreview(val.hero_image_url);
                    }
                    if (item.key === 'shipping') setShipping(item.value as typeof DEFAULTS.shipping);
                    if (item.key === 'logistics') setLogistics(item.value as typeof DEFAULTS.logistics);
                    if (item.key === 'catalog') setCatalog(item.value as typeof DEFAULTS.catalog);
                    if (item.key === 'promotions') setPromotions(item.value as typeof DEFAULTS.promotions);
                    if (item.key === 'theme_config') setTheme(item.value as typeof DEFAULTS.theme_config);
                    if (item.key === 'seo_config') setSeo(item.value as typeof DEFAULTS.seo_config);
                    if (item.key === 'social_links') setSocial(item.value as typeof DEFAULTS.social_links);
                    if (item.key === 'store_info') setStore(item.value as typeof DEFAULTS.store_info);
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const uploadAsset = async (file: File, folder: string) => {
        const BUCKET = 'apexstores-assets';
        const path = `${folder}/${folder.split('/')[0]}-${Date.now()}`;
        const { error: uploadError } = await supabase!.storage.from(BUCKET).upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase!.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
    };

    const handleSave = async (key: string, value: unknown, publish: boolean = true) => {
        if (!supabase) return;
        setSavingKey(key);
        setMessage(null);

        let finalValue = value;

        try {
            // Handle File Uploads for Branding
            if (key === 'branding') {
                const updatedBrandingLocal = { ...(value as Record<string, unknown>) };
                if (logoFile) updatedBrandingLocal.logo_url = await uploadAsset(logoFile, 'branding');
                if (faviconFile) updatedBrandingLocal.favicon_url = await uploadAsset(faviconFile, 'branding');
                finalValue = updatedBrandingLocal;
                setBranding(updatedBrandingLocal as typeof branding);
                setLogoFile(null);
                setFaviconFile(null);
            }

            // Handle File Uploads for Homepage
            if (key === 'homepage') {
                const updatedHomepageLocal = { ...(value as Record<string, unknown>) };
                if (heroFile) updatedHomepageLocal.hero_image_url = await uploadAsset(heroFile, 'homepage');
                finalValue = updatedHomepageLocal;
                setHomepage(updatedHomepageLocal as typeof homepage);
                setHeroFile(null);
            }

            const { error } = await supabase
                .from('settings')
                .upsert({
                    key,
                    value: finalValue,
                    is_published: publish,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;

            await logAuditAction(email, 'UPDATE_SETTINGS', { key, published: publish });
            setMessage({
                type: 'success',
                text: publish ? `${key.toUpperCase()} published to live site.` : `${key.toUpperCase()} saved as draft.`
            });

            setTimeout(() => setMessage(null), 5000);
        } catch (err: unknown) {
            const error = err as Error;
            console.error("Save Error:", error);
            setMessage({ type: 'error', text: error.message || 'Failed to update.' });
        } finally {
            setSavingKey(null);
        }
    };

    const handlePublishAll = async () => {
        if (!supabase) return;
        setSavingKey('all');
        try {
            const updatedBrandingLocal = { ...branding };
            const updatedHomepageLocal = { ...homepage };

            if (logoFile) updatedBrandingLocal.logo_url = await uploadAsset(logoFile, 'branding');
            if (faviconFile) updatedBrandingLocal.favicon_url = await uploadAsset(faviconFile, 'branding');
            if (heroFile) updatedHomepageLocal.hero_image_url = await uploadAsset(heroFile, 'homepage');

            const payloads = [
                { key: 'contact', value: contact },
                { key: 'branding', value: updatedBrandingLocal },
                { key: 'homepage', value: updatedHomepageLocal },
                { key: 'theme_config', value: theme },
                { key: 'seo_config', value: seo },
                { key: 'social_links', value: social },
                { key: 'store_info', value: store },
                { key: 'promotions', value: promotions },
                { key: 'shipping', value: shipping },
                { key: 'logistics', value: logistics },
                { key: 'catalog', value: catalog },
            ];

            const { error } = await supabase
                .from('settings')
                .upsert(payloads.map(p => ({ ...p, is_published: true, updated_at: new Date().toISOString() })), { onConflict: 'key' });

            if (error) throw error;

            setBranding(updatedBrandingLocal);
            setHomepage(updatedHomepageLocal);
            setLogoFile(null);
            setFaviconFile(null);
            setHeroFile(null);

            setMessage({ type: 'success', text: "All changes synchronized to the live storefront." });
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSavingKey(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="font-black text-muted-foreground uppercase tracking-widest text-[10px]">Establishing Secure Uplink...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left selection:bg-primary/20 pb-40">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Brand OS</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Professional Content Management & Storefront Identity Hub.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchSettings} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest hover:bg-secondary transition-all">
                        <RefreshCcw className="h-4 w-4 mr-2" /> Sync Records
                    </Button>
                    <Button
                        onClick={() => {
                            if (activeTab === 'identity') handleSave('branding', branding, true);
                            else if (activeTab === 'homepage') handleSave('homepage', homepage, true);
                            else if (activeTab === 'theme') handleSave('theme_config', theme, true);
                            else if (activeTab === 'seo') handleSave('seo_config', seo, true);
                            else if (activeTab === 'ops') {
                                handleSave('contact', contact, true);
                                handleSave('shipping', shipping, true);
                            }
                            else if (activeTab === 'catalog') handleSave('catalog', catalog, true);
                            else if (activeTab === 'advanced') handleSave('theme_config', theme, true);
                        }}
                        className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20"
                    >
                        <Save className="h-4 w-4 mr-2" /> Sync Changes
                    </Button>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2rem] border-2 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500 shadow-xl relative overflow-hidden",
                    message.type === 'success' ? "bg-primary/5 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" /> : <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                        <p className="text-sm font-black uppercase tracking-tight mb-1">{message.type === 'success' ? 'Command Acknowledged' : 'Interference Detected'}</p>
                        <p className="text-xs font-medium leading-relaxed italic">{message.text}</p>
                    </div>
                </div>
            )}

            {/* CMS Tab Navigation */}
            <div className="flex gap-2 p-1 bg-card rounded-2xl border border-border shadow-sm overflow-x-auto no-scrollbar max-w-5xl">
                {[
                    { id: 'identity', label: 'Identity', icon: Info },
                    { id: 'homepage', label: 'Homepage', icon: HomeIcon },
                    { id: 'theme', label: 'Theme', icon: Palette },
                    { id: 'seo', label: 'SEO & Social', icon: Globe },
                    { id: 'ops', label: 'Operations', icon: Truck },
                    { id: 'catalog', label: 'Catalog', icon: Smartphone },
                    { id: 'advanced', label: 'Advanced', icon: Code },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabId)}
                        className={cn(
                            "flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 border-transparent",
                            activeTab === tab.id ? "bg-primary text-background border-primary shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">

                    {/* IDENTITY TAB */}
                    {activeTab === 'identity' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-8 text-left">
                                <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><Info className="h-5 w-5 text-primary" /> Core Identity</h2>
                                <div className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Owner Name</label>
                                            <Input value={branding.owner_name} onChange={e => setBranding({...branding, owner_name: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground" />
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Portfolio URL</label>
                                            <Input value={branding.portfolio_url} onChange={e => setBranding({...branding, portfolio_url: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border font-bold text-xs text-foreground" />
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Store Public Name</label>
                                            <Input value={store.name} onChange={e => setStore({...store, name: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground" />
                                        </div>
                                        <div className="space-y-2 text-left pt-6">
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase italic leading-relaxed">
                                                * Global Brand Metadata. Updates the logo and general store nomenclature.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setLogoFile(file);
                                                setLogoPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <input
                                        type="file"
                                        ref={faviconInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setFaviconFile(file);
                                                setFaviconPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />

                                    <div
                                        onClick={() => logoInputRef.current?.click()}
                                        className="flex-1 p-8 rounded-3xl bg-secondary border border-border flex flex-col items-center gap-4 group cursor-pointer hover:border-primary/20 transition-all overflow-hidden"
                                    >
                                        {logoPreview ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={logoPreview} className="h-10 w-auto object-contain" alt="Store Logo Preview" />
                                        ) : (
                                            <ImageIcon className="h-10 w-10 text-muted group-hover:text-primary transition-colors" />
                                        )}
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Upload Store Logo</p>
                                    </div>

                                    <div
                                        onClick={() => faviconInputRef.current?.click()}
                                        className="flex-1 p-8 rounded-3xl bg-secondary border border-border flex flex-col items-center gap-4 group cursor-pointer hover:border-primary/20 transition-all overflow-hidden"
                                    >
                                        {faviconPreview ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={faviconPreview} className="h-10 w-10 object-contain rounded-lg" alt="Favicon Preview" />
                                        ) : (
                                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-background font-black group-hover:bg-primary transition-all text-xs">A</div>
                                        )}
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Upload Favicon</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* HOMEPAGE TAB */}
                    {activeTab === 'homepage' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-8">
                                <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><HomeIcon className="h-5 w-5 text-primary" /> Hero Configuration</h2>

                                <div className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Main Headline</label>
                                            <Input
                                                value={branding.hero_title}
                                                onChange={e => setBranding({...branding, hero_title: e.target.value})}
                                                className="h-14 rounded-2xl bg-secondary border-border font-black text-lg text-foreground"
                                            />
                                            <p className="text-[7px] font-bold text-primary uppercase italic px-1">* PRO TIP: Use a &quot;.&quot; to split colors. (e.g., &quot;Future Sound. Total Power.&quot;)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Subtitle Mission</label>
                                            <Input
                                                value={branding.hero_subtitle}
                                                onChange={e => setBranding({...branding, hero_subtitle: e.target.value})}
                                                className="h-14 rounded-2xl bg-secondary border-border font-medium text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Hero Visual Payload (Image)</label>
                                        <input
                                            type="file"
                                            ref={heroInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setHeroFile(file);
                                                    setHeroPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        <div
                                            onClick={() => heroInputRef.current?.click()}
                                            className="w-full h-64 rounded-[2.5rem] border-2 border-dashed border-border bg-secondary flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/30 transition-all overflow-hidden group"
                                        >
                                            {heroPreview ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={heroPreview} alt="Hero Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <>
                                                    <ImageIcon className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Select Tactical Backdrop</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Starting Price</label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={homepage.hero_starting_price}
                                                    onChange={e => setHomepage({...homepage, hero_starting_price: Number(e.target.value)})}
                                                    className="h-14 rounded-2xl bg-secondary border-border pl-12 font-black text-lg text-foreground"
                                                />
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Top Badge Alert</label>
                                            <Input
                                                value={homepage.hero_badge_text}
                                                onChange={e => setHomepage({...homepage, hero_badge_text: e.target.value})}
                                                className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Visual Series Label</label>
                                            <Input
                                                value={homepage.hero_visual_label || ''}
                                                onChange={e => setHomepage({...homepage, hero_visual_label: e.target.value})}
                                                className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground"
                                                placeholder="e.g. Apex Premium Series"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* THEME TAB */}
                    {activeTab === 'theme' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-10 text-left">
                                <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><Palette className="h-5 w-5 text-primary" /> Theme Engine</h2>
                                <div className="grid sm:grid-cols-3 gap-8">
                                    {[
                                        { id: 'primary', label: 'Primary (Action)', val: theme.primary },
                                        { id: 'secondary', label: 'Secondary (Light)', val: theme.secondary },
                                        { id: 'accent', label: 'Accent (UI)', val: theme.accent },
                                    ].map(color => (
                                        <div key={color.id} className="space-y-4 text-left">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground block ml-1">{color.label}</label>
                                            <div className="flex items-center gap-3">
                                                <div className="h-14 w-14 rounded-2xl shadow-xl border-4 border-background shrink-0 overflow-hidden relative">
                                                    <input
                                                        type="color"
                                                        value={color.val}
                                                        onChange={e => setTheme({...theme, [color.id]: e.target.value})}
                                                        className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                                                    />
                                                </div>
                                                <Input value={color.val} onChange={e => setTheme({...theme, [color.id]: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border font-mono text-[10px] text-foreground" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* SEO & SOCIAL TAB */}
                    {activeTab === 'seo' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-8 text-left">
                                <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><Globe className="h-5 w-5 text-primary" /> Search Intelligence</h2>
                                <div className="space-y-6 text-left">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground">Homepage Title Tag</label>
                                        <Input value={seo.title} onChange={e => setSeo({...seo, title: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground" />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground">Meta Description</label>
                                        <textarea value={seo.description} onChange={e => setSeo({...seo, description: e.target.value})} className="w-full h-24 p-5 rounded-2xl bg-secondary border border-border text-foreground font-medium text-xs resize-none outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground">Keywords (Comma Separated)</label>
                                        <Input value={seo.keywords} onChange={e => setSeo({...seo, keywords: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border text-foreground" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-8 text-left">
                                <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><Activity className="h-5 w-5 text-primary" /> Social Extraction</h2>
                                <div className="grid sm:grid-cols-2 gap-6 text-left">
                                    {[
                                        { id: 'instagram', icon: Camera, label: 'Instagram URL' },
                                        { id: 'tiktok', icon: Smartphone, label: 'TikTok URL' },
                                        { id: 'facebook', icon: Share2, label: 'Facebook Page' },
                                        { id: 'x', icon: Globe, label: 'X (Twitter)' },
                                    ].map(item => (
                                        <div key={item.id} className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                                <item.icon className="h-3 w-3" /> {item.label}
                                            </label>
                                            <Input value={(social as Record<string, string>)[item.id]} onChange={e => setSocial({...social, [item.id]: e.target.value})} className="h-12 rounded-xl bg-secondary border-border text-[10px] font-bold text-foreground" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* CATALOG TAB */}
                    {activeTab === 'catalog' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-8 text-left">
                                <div className="flex justify-between items-center text-left">
                                    <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><Smartphone className="h-5 w-5 text-primary" /> Category Manager</h2>
                                    <Button onClick={() => setCatalog({ ...catalog, categories: [...catalog.categories, { id: '', label: '' }] })} variant="outline" className="h-10 rounded-xl text-[8px] font-black uppercase"><Plus className="h-3 w-3 mr-2" /> New Category</Button>
                                </div>
                                <div className="space-y-4 text-left">
                                    {catalog.categories.map((cat, idx) => (
                                        <div key={idx} className="flex gap-4 items-end p-6 bg-secondary rounded-3xl border border-border relative group/cat">
                                            <div className="flex-1 space-y-2 text-left">
                                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Label (Visible to customers)</label>
                                                <Input value={cat.label} onChange={e => {
                                                    const newCats = [...catalog.categories];
                                                    newCats[idx].label = e.target.value;
                                                    setCatalog({ ...catalog, categories: newCats });
                                                }} className="h-12 rounded-xl bg-card border-none font-bold text-foreground" placeholder="e.g. Elite Audio" />
                                            </div>
                                            <div className="flex-1 space-y-2 text-left">
                                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Slug/ID (Database tag)</label>
                                                <Input value={cat.id} onChange={e => {
                                                    const newCats = [...catalog.categories];
                                                    newCats[idx].id = e.target.value.toLowerCase().replace(/\s+/g, '-');
                                                    setCatalog({ ...catalog, categories: newCats });
                                                }} className="h-12 rounded-xl bg-card border-none font-mono text-xs text-foreground" placeholder="e.g. airpods" />
                                            </div>
                                            <button
                                                onClick={() => setCatalog({ ...catalog, categories: catalog.categories.filter((_, i) => i !== idx) })}
                                                className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-colors opacity-0 group-hover/cat:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* OPERATIONS TAB */}
                    {activeTab === 'ops' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                                <div className="bg-card rounded-[2.5rem] border border-border p-10 shadow-sm space-y-8 flex flex-col text-left">
                                    <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary" /> Contact Hub
                                    </h2>
                                    <div className="space-y-5 flex-1 text-left">
                                        <div className="space-y-1 text-left">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">WhatsApp Business</label>
                                            <Input value={contact.whatsapp} onChange={e => setContact({...contact, whatsapp: e.target.value})} className="rounded-2xl h-14 bg-secondary border-border font-bold text-foreground" />
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Support Email</label>
                                            <Input value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} className="rounded-2xl h-14 bg-secondary border-border font-bold text-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-card rounded-[2.5rem] border border-border p-10 shadow-sm space-y-8 flex flex-col text-left">
                                    <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3">
                                        <Truck className="h-5 w-5 text-primary" /> Logistics
                                    </h2>
                                    <div className="space-y-4 flex-1 text-left">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CBD Label</label>
                                                <Input value={shipping.nairobi_cbd_label} onChange={e => setShipping({...shipping, nairobi_cbd_label: e.target.value})} className="rounded-xl h-12 bg-secondary border-border font-bold text-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CBD Fee</label>
                                                <Input type="number" value={shipping.nairobi_cbd} onChange={e => setShipping({...shipping, nairobi_cbd: Number(e.target.value)})} className="rounded-xl h-12 bg-secondary border-border font-black text-foreground" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Outskirts Label</label>
                                                <Input value={shipping.nairobi_outskirts_label} onChange={e => setShipping({...shipping, nairobi_outskirts_label: e.target.value})} className="rounded-xl h-12 bg-secondary border-border font-bold text-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Outskirts Fee</label>
                                                <Input type="number" value={shipping.nairobi_outskirts} onChange={e => setShipping({...shipping, nairobi_outskirts: Number(e.target.value)})} className="rounded-xl h-12 bg-secondary border-border font-black text-foreground" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Upcountry Label</label>
                                                <Input value={shipping.upcountry_label} onChange={e => setShipping({...shipping, upcountry_label: e.target.value})} className="rounded-xl h-12 bg-secondary border-border font-bold text-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Upcountry Fee</label>
                                                <Input type="number" value={shipping.upcountry} onChange={e => setShipping({...shipping, upcountry: Number(e.target.value)})} className="rounded-xl h-12 bg-secondary border-border font-black text-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-8 mt-8">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> Operational Zones</h2>
                                    <Button onClick={() => setLogistics({ ...logistics, dispatch_zones: [...logistics.dispatch_zones, ''] })} variant="outline" className="h-10 rounded-xl text-[8px] font-black uppercase"><Plus className="h-3 w-3 mr-2" /> Add Zone</Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {logistics.dispatch_zones.map((zone, idx) => (
                                        <div key={idx} className="relative group">
                                            <Input
                                                value={zone}
                                                onChange={e => {
                                                    const newZones = [...logistics.dispatch_zones];
                                                    newZones[idx] = e.target.value;
                                                    setLogistics({ ...logistics, dispatch_zones: newZones });
                                                }}
                                                className="h-12 rounded-xl bg-secondary border-border pr-10 font-bold text-[10px] text-foreground"
                                            />
                                            <button
                                                onClick={() => setLogistics({ ...logistics, dispatch_zones: logistics.dispatch_zones.filter((_, i) => i !== idx) })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* ADVANCED TAB */}
                    {activeTab === 'advanced' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-10 relative overflow-hidden text-left">
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><ShieldAlert className="h-6 w-6" /></div>
                                        <div>
                                            <h2 className="text-xl font-black text-foreground uppercase">Tactical Sandbox</h2>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Simulate orders & payments</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsSandboxMode(!isSandboxMode)}
                                        className={cn(
                                            "w-20 h-10 rounded-full transition-all relative p-1 flex items-center shadow-inner",
                                            isSandboxMode ? "bg-emerald-500" : "bg-secondary"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-full bg-white shadow-xl transition-all flex items-center justify-center",
                                            isSandboxMode ? "translate-x-10" : "translate-x-0"
                                        )}>
                                            {isSandboxMode ? <CheckCircle2 size={16} className="text-emerald-500" /> : <X size={16} className="text-slate-300" />}
                                        </div>
                                    </button>
                                </div>

                                {isSandboxMode && (
                                    <div className="p-8 rounded-[2.5rem] bg-emerald-50/50 border-2 border-dashed border-emerald-200 text-emerald-700 animate-in zoom-in-95 duration-500">
                                        <div className="flex items-start gap-4">
                                            <Zap size={20} className="mt-1 animate-pulse" />
                                            <div className="space-y-2">
                                                <p className="text-sm font-black uppercase tracking-tight">Active Duty: Sandbox Mode</p>
                                                <p className="text-xs font-medium leading-relaxed italic">
                                                    The system is now isolated. You can test Order Dispatch, Payment Webhooks, and Loyalty Rewards without affecting production ledgers or live customers.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            <Card className="rounded-[3rem] border border-border p-10 bg-card shadow-sm space-y-8 overflow-hidden relative text-left">
                                <div className="flex items-center justify-between text-left">
                                    <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3"><Code className="h-5 w-5 text-muted-foreground" /> Surgical Tweaks</h2>
                                    <div className="flex items-center gap-3 p-1 bg-secondary rounded-xl border border-border text-left">
                                        <button onClick={() => setIsAdvancedEnabled(!isAdvancedEnabled)} className={cn("px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-2", isAdvancedEnabled ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground")}>
                                            {isAdvancedEnabled ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                            {isAdvancedEnabled ? 'Armed' : 'Locked'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 text-left">
                                        <p className="text-muted-foreground font-medium leading-relaxed italic text-xs text-left">
                                            <ShieldAlert className="h-10 w-10 text-amber-500 shrink-0" />
                                            &quot;Warning: Custom CSS bypasses the theme engine. Incorrect syntax will destabilize the storefront rendering loop.&quot;
                                        </p>
                                    <textarea
                                        disabled={!isAdvancedEnabled}
                                        value={theme.custom_css}
                                        onChange={e => setTheme({...theme, custom_css: e.target.value})}
                                        placeholder="/* Custom CSS Protocol... */"
                                        className={cn(
                                            "w-full h-80 p-8 rounded-[2.5rem] bg-secondary border border-border text-primary font-mono text-xs leading-relaxed resize-none outline-none transition-all duration-1000",
                                            !isAdvancedEnabled && "opacity-30 blur-sm pointer-events-none"
                                        )}
                                    />
                                </div>
                                <Zap className="absolute -bottom-20 -right-20 h-64 w-64 text-primary/5 rotate-45 -z-0" />
                            </Card>
                        </div>
                    )}
                </div>

                {/* SIDEBAR: LIVE PREVIEW & STATUS */}
                <div className="lg:col-span-4 space-y-10 text-left">

                    {/* STORE PULSE WIDGET */}
                    <Card className="p-8 rounded-[3rem] bg-card border border-border shadow-sm space-y-8 relative overflow-hidden group text-left">
                        <div className="relative z-10 space-y-8 text-left">
                            <div className="flex items-center justify-between text-left">
                                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em]">Store Pulse</h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase border border-primary/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
                                </div>
                            </div>

                            <div className="space-y-6 text-left">
                                <div className="flex justify-between items-center border-b border-border pb-4 text-left">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground">Version</span>
                                    <span className="text-xs font-black text-foreground">v2.5.0-Titan</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border pb-4 text-left">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground">Cloud Storage</span>
                                    <span className="text-xs font-black text-foreground">68% Capacity</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 text-left">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground">Active Themes</span>
                                    <span className="text-xs font-black text-primary">Platinum Light</span>
                                </div>
                            </div>

                            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3 text-left">
                                <Clock className="h-4 w-4 text-primary" />
                                <p className="text-[8px] font-black uppercase text-muted-foreground">Last Published: Just now</p>
                            </div>
                        </div>
                    </Card>

                    {/* LIVE PREVIEW COMPONENT */}
                    <div className="space-y-4 text-left">
                        <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] ml-4 flex items-center gap-2 text-left">
                            <Eye className="h-3 w-3" /> Real-time Simulation
                        </h3>
                        <div className="bg-card rounded-[3rem] border border-border shadow-2xl overflow-hidden group text-left">
                            {/* Mini Header */}
                            <div className="bg-card p-6 border-b border-border flex justify-between items-center text-left">
                                <div className="flex items-center gap-2 text-left">
                                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm overflow-hidden">
                                        {logoPreview ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain" />
                                        ) : (
                                            <Smartphone className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-foreground tracking-tight">{store.name}</span>
                                </div>
                                <div className="flex gap-2 text-left">
                                    <div className="h-1.5 w-8 rounded-full bg-border" />
                                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                                </div>
                            </div>
                            {/* Mini Hero */}
                            <div className="p-10 text-center space-y-6 relative overflow-hidden bg-secondary min-h-[350px] flex flex-col justify-center text-left">
                                {heroPreview && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={heroPreview} alt="Hero Preview" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                )}
                                <div className="relative z-10 space-y-4 text-left">
                                    <h4 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-[0.9] break-words text-left">
                                        {branding.hero_title.split('.')[0]}.<br/>
                                        <span style={{ color: theme.primary }} className="italic">{branding.hero_title.split('.')[1] || ''}</span>
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic line-clamp-2 px-4 text-left">{branding.hero_subtitle}</p>
                                    <div className="pt-4 text-left">
                                        <button style={{ backgroundColor: theme.primary }} className="px-6 py-2.5 rounded-full text-white font-black uppercase text-[8px] tracking-widest shadow-xl shadow-primary/20">Shop Now</button>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: theme.primary }} className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full opacity-10 blur-3xl text-left" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STICKY CMS ACTION BAR (Frosted Platinum) */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-1000 w-full max-w-4xl px-4 text-left">
                <div className="bg-background/80 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl flex items-center gap-3 border border-border text-left">
                    <Button
                        disabled={savingKey !== null}
                        onClick={handlePublishAll}
                        className="flex-1 h-16 rounded-2xl bg-primary text-background font-black uppercase tracking-[0.2em] text-xs hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20 group"
                    >
                        {savingKey === 'all' ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Rocket className="h-5 w-5 mr-3 group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform" />}
                        Publish Protocol
                    </Button>
                    <div className="flex gap-2 p-1 bg-secondary rounded-xl border border-border pr-4 text-left">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                if (activeTab === 'identity') handleSave('branding', branding, true);
                                else if (activeTab === 'homepage') handleSave('homepage', homepage, true);
                                else if (activeTab === 'theme') handleSave('theme_config', theme, true);
                                else if (activeTab === 'seo') handleSave('seo_config', seo, true);
                                else if (activeTab === 'ops') {
                                    handleSave('contact', contact, true);
                                    handleSave('shipping', shipping, true);
                                }
                                else if (activeTab === 'catalog') handleSave('catalog', catalog, true);
                                else if (activeTab === 'advanced') handleSave('theme_config', theme, true);
                            }}
                            className="h-12 px-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card font-black uppercase text-[9px]"
                        >
                            Sync Now
                        </Button>
                        <div className="w-px h-6 bg-border self-center mx-2" />
                        <Button variant="ghost" onClick={fetchSettings} className="h-12 px-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card font-black uppercase text-[9px]">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
