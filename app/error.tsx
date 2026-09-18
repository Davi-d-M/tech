'use client';

import { ShieldAlert, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased font-sans">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto border-4 border-white shadow-lg">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase leading-none">
            Module <span className="text-amber-500">Hang</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
            We couldn't load this part of the shop. This usually happens when the data node times out.
          </p>
        </div>

        <Button
          onClick={() => reset()}
          className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry Connection
        </Button>

        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] pt-4">
          Apex OS Protection active
        </p>
      </div>
    </div>
  );
}
