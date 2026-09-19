import { Smartphone } from 'lucide-react';

/**
 * Root Loading State: Apex OS Stealth Pulse
 * Shown when the server is preparing the initial data payload.
 */
export default function RootLoading() {
  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="relative">
            <div className="h-16 w-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary shadow-inner border border-primary/5 animate-pulse">
                <Smartphone className="h-8 w-8" />
            </div>
            {/* Spinning orbit */}
            <div className="absolute inset-0 h-16 w-16 rounded-3xl border-2 border-primary/20 border-t-primary animate-spin"></div>
        </div>

        <div className="mt-8 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 animate-pulse">
                Apex OS Resilience Protocol
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-200">
                Synchronizing Secure Neural Hub...
            </p>
        </div>

        {/* Decorative corner accents */}
        <div className="fixed top-8 left-8 h-4 w-4 border-t-2 border-l-2 border-slate-50"></div>
        <div className="fixed bottom-8 right-8 h-4 w-4 border-b-2 border-r-2 border-slate-50"></div>
    </div>
  );
}
