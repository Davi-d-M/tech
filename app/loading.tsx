export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
      <div className="space-y-4 text-center">
        <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-xl mx-auto"></div>
        <div className="h-4 w-48 bg-slate-50 animate-pulse rounded-lg mx-auto"></div>
      </div>
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-5xl opacity-20">
          {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
          ))}
      </div>
      <p className="fixed bottom-10 text-[9px] font-black uppercase text-slate-300 tracking-[0.4em]">Initializing Titan Protocol...</p>
    </div>
  );
}
