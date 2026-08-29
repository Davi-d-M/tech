"use client";

import {
  ArrowRight,
  Heart,
  Mail,
  MapPin,
  Phone,
  Zap,
  ShieldCheck,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { useSettings, type StoreSettings } from "@/lib/useSettings";
import { cn } from "@/lib/utils";

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

  const footerSections = [
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
        { href: "/rider/dashboard", label: "Rider Command" },
        { href: "/track", label: "Global Tracking" },
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
              Join the Elite
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 text-left">
            <div className="lg:col-span-2">
              <Link
                className="text-2xl tracking-tighter font-black text-foreground hover:text-primary transition-colors uppercase"
                href="/"
                aria-label="Apexstores Home"
              >
                Apex<span className="text-primary">stores</span>
              </Link>
              <p className="text-muted-foreground mt-4 mb-6 max-w-sm font-medium leading-relaxed">
                Premium electronics and mobile accessories engineered for excellence. Performance and design in every gadget.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{loading ? '...' : settings.contact.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+{loading ? '...' : settings.contact.whatsapp}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{loading ? '...' : settings.contact.email}</span>
                </div>
              </div>
            </div>

            {footerSections.map((section, index) => (
              <div
                key={section.title}
                className={`${index >= 2 ? "lg:col-span-1" : ""}`}
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
                Developed by <a href={loading ? "#" : settings.branding.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{loading ? "..." : settings.branding.owner_name}</a>
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
