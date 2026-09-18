'use client';

import { ShieldAlert, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased font-sans">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto border-4 border-white shadow-lg">
            <ShieldAlert className="h-10 w-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase leading-none">
              System Breach <span className="text-rose-500">Detected</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              The OS encountered a fatal error during synchronization. Access to the neural hub has been temporarily suspended.
            </p>
            {error.digest && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <code className="text-[9px] font-black uppercase text-slate-400 tracking-widest">ERROR_REF: {error.digest}</code>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4">
            <Button
              onClick={() => reset()}
              className="h-16 rounded-2xl bg-primary text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Restart OS
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="h-16 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all"
            >
              <Home className="mr-2 h-4 w-4" /> Return to Base
            </Button>
          </div>

          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] pt-4">
            Apex Technical Resilience Protocol Active
          </p>
        </div>
      </body>
    </html>
  );
}
