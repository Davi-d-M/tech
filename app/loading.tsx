export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white gap-6">
      <div className="relative">
        <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-2xl animate-pulse">
            <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
            </svg>
        </div>
        <div className="absolute -inset-4 border-2 border-primary/20 rounded-[2.5rem] animate-[spin_3s_linear_infinite]" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Apex OS Initializing</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Establishing Secure Uplink...</p>
      </div>
    </div>
  );
}
