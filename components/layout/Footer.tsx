"use client";

import {
  ArrowRight,
  Heart,
  Mail,
  MapPin,
  Phone,
  Zap,
  ShieldCheck,
  Loader2,
  Camera as Instagram,
  Share2 as Facebook
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { useSettings, type StoreSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

export default function Footer({ initialSettings }: { initialSettings?: StoreSettings }) {
  const { settings: hookSettings, loading } = useSettings();
  const settings = initialSettings || hookSettings;
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: "" });

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: "" });

    try {
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            setStatus({ type: 'success', message: data.message || "Welcome to the club!" });
            setEmail("");
        } else {
            throw new Error(data.error || "Subscription failed.");
        }
    } catch (err: unknown) {
        setStatus({ type: 'error', message: (err as Error).message });
    } finally {
        setIsSubmitting(false);
        setTimeout(() => setStatus({ type: 'idle', message: "" }), 5000);
    }
  };

  const footerSections = settings?.navigation?.footer_sections || [
    {
      title: "Shop",
      links: [
        { href: "/shop", label: "All Products" },
        { href: "/shop/category/new-arrivals", label: "New Arrivals" },
        { href: "/shop/category/sale", label: "Sale" },
        { href: "/shop/category/featured", label: "Featured" },
      ],
    },
    {
      title: "Customer Care",
      links: [
        { href: "/contact", label: "Contact Us" },
        { href: "/track", label: "Track Order" },
        { href: "/shipping", label: "Shipping Info" },
        { href: "/returns", label: "Returns & Exchanges" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About Us" },
        { href: "/blog", label: "Library" },
        { href: "/contact", label: "Support" },
      ],
    },
    {
      title: "Logistics",
      links: [
        { href: "/rider/login", label: "Runner Command" },
        { href: "/admin", label: "Control Center" },
        { href: "/track", label: "Live Tracking" },
      ],
    },
    {
      title: "Partners",
      links: [
        { href: "/supplier/onboarding", label: "Become a Merchant" },
        { href: "/rider/onboarding", label: "Become a Runner" },
        { href: "/supplier/login", label: "Supplier Login" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/cookies", label: "Cookie Policy" },
        { href: "/accessibility", label: "Accessibility" },
      ],
    },
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 border-b border-border" id="footer-newsletter">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-4">
              Join the Community
            </h3>
            <p className="text-muted-foreground mb-6 font-medium">
              Subscribe to our newsletter for exclusive tech offers, new gadget arrivals,
              and early access to flash sales.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex max-w-md mx-auto gap-2"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-xl h-12"
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-xl"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
            {status.message && (
                <p className={cn(
                    "mt-4 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95",
                    status.type === 'success' ? "text-emerald-500" : "text-rose-500"
                )}>
                    {status.message}
                </p>
            )}
          </div>
        </div>

        <div className="py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-left">
            <div className="lg:col-span-1">
              <Link
                className="text-2xl tracking-tighter font-black text-foreground hover:text-primary transition-colors uppercase"
                href="/"
                aria-label="Apexstores Home"
              >
                Apex<span className="text-primary">stores</span>
              </Link>
              <p className="text-muted-foreground mt-4 mb-6 max-w-sm font-medium leading-relaxed">
                {settings?.content?.about_us || 'Premium tech essentials and late night gadgets delivered to your doorstep. Chilled and ready for your operation.'}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span>{loading ? '...' : settings.contact.address}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <Phone className="h-3 w-3 text-primary" />
                  <span>+{loading ? '...' : settings.contact.whatsapp}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <Mail className="h-3 w-3 text-primary" />
                  <span>{loading ? '...' : settings.contact.email}</span>
                </div>
              </div>

              {/* Social Links Restoration */}
              <div className="flex gap-4 mt-8">
                  {settings.social_links.instagram && (
                      <a href={settings.social_links.instagram} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all hover:shadow-lg">
                          <Instagram size={18} />
                      </a>
                  )}
                  {settings.social_links.facebook && (
                      <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all hover:shadow-lg">
                          <Facebook size={18} />
                      </a>
                  )}
                  {settings.social_links.tiktok && (
                      <a href={settings.social_links.tiktok} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all hover:shadow-lg">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-.99 0-1.49.18-3.4 2.36-6.52 5.56-7.75.49-.14.99-.36 1.5-.42V7.7c-.45.05-.91.24-1.34.42-1.3.52-2.33 1.51-2.91 2.74-.53 1.12-.66 2.34-.41 3.55.19 1.1.75 2.11 1.59 2.89.87.81 2.02 1.3 3.21 1.33.68.04 1.37-.1 1.99-.4.94-.47 1.72-1.28 2.06-2.25.13-.42.23-.84.23-1.28.02-4.17-.02-8.33.02-12.5z"/></svg>
                      </a>
                  )}
              </div>
            </div>

            {footerSections.map((section) => (
              <div
                key={section.title}
                className="lg:col-span-1"
              >
                <h4 className="text-[10px] font-black text-foreground mb-6 uppercase tracking-[0.2em]">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-primary transition-all duration-300 inline-block font-bold uppercase tracking-widest"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-8 opacity-50" />

        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <span>© 2026 Apexstores™. Made with</span>
              <Heart className="h-3 w-3 text-rose-500 fill-current" />
              <span>All Rights Reserved.</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-2">
                Developed by <a href={loading ? "#" : (settings.branding.portfolio_url || "https://tech-paxv.onrender.com")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{loading ? "..." : (settings.branding.owner_name || "Apex stores")}</a>
            </p>
          </div>

          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fast Dispatch</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verified Tech</span>
              </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
