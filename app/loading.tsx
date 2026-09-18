import { Smartphone } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse scale-150"></div>
        <div className="relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
          <Smartphone className="h-12 w-12 text-primary animate-bounce" />
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">
          Apex<span className="text-primary">OS</span>
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 animate-pulse">
          Synchronizing Neural Hub...
        </p>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-primary animate-[shimmer_2s_infinite_linear]"></div>
        </div>
      </div>
    </div>
  );
}
