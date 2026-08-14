import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-8 p-6">
      <div className="relative">
        <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30 z-10 relative">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <div className="absolute -inset-4 border-4 border-primary/10 rounded-[2rem] animate-ping" />
        <div className="absolute -inset-8 border border-primary/5 rounded-[2.5rem] animate-pulse" />
      </div>

      <div className="space-y-4 text-center max-w-xs">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Command Center</h2>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">Authorized Access Only</p>
        </div>

        <div className="pt-8 space-y-3">
          <div className="flex justify-between items-center px-4">
            <span className="text-[8px] font-black uppercase text-slate-400">Decrypting Ledgers</span>
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-[shimmer_2s_infinite]" style={{ width: '65%' }} />
          </div>
          <p className="text-[10px] font-medium italic text-slate-400">&quot;Synchronizing with Apex Cloud Protocol v4.0&quot;</p>
        </div>
      </div>
    </div>
  );
}
