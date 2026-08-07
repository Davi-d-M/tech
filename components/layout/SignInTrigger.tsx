"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "../ui/button";
import { X, Zap, Crown, ShieldCheck, TrendingUp, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SignInTrigger() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkAuthAndTrigger = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();

      // Only show if user is NOT logged in
      if (!session) {
        const hasBeenShown = localStorage.getItem("apex_signin_trigger_shown");
        if (!hasBeenShown) {
          // Delay appearance for better UX
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 3000);
          return () => clearTimeout(timer);
        }
      }
    };

    checkAuthAndTrigger();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("apex_signin_trigger_shown", "true");
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/70 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative max-w-lg w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-10 sm:p-12 text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner animate-pulse">
                <Crown className="h-10 w-10" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Elevate Your Experience</h2>
            <p className="text-slate-500 font-medium italic text-sm">
                &quot;Join the elite circle of tech enthusiasts and unlock a new dimension of performance.&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              { icon: Zap, label: "Daily Streaks & XP", color: "text-primary" },
              { icon: Crown, label: "Elite Member Perks", color: "text-primary" },
              { icon: ShieldCheck, label: "Priority Care", color: "text-emerald-500" },
              { icon: TrendingUp, label: "Better Service", color: "text-indigo-500" },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all duration-300">
                <benefit.icon className={cn("h-5 w-5", benefit.color)} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{benefit.label}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-4">
            <Link href="/auth?mode=signup" onClick={handleClose} className="block">
              <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                <UserPlus className="h-4 w-4 mr-2" /> Initialize Membership
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Already a member?</span>
                <Link href="/auth?mode=signin" onClick={handleClose} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4">
                  Sign In Protocol
                </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar Decor */}
        <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-primary/50 w-full" />
      </div>
    </div>
  );
}
