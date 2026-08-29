import { Layers } from 'lucide-react';

export default function AdminDashboardLoading() {
  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end border-b border-slate-200 pb-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-10 w-64 bg-slate-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-12 w-32 bg-slate-200 rounded-xl" />
          <div className="h-12 w-40 bg-slate-200 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="h-48 bg-white rounded-[3rem] border border-slate-100 animate-pulse" />
        <div className="h-48 bg-white rounded-[3rem] border border-slate-100 animate-pulse" />
        <div className="h-48 bg-white rounded-[3rem] border border-slate-100 animate-pulse" />
      </div>

      <div className="space-y-6">
        <div className="h-40 bg-white rounded-[3rem] border border-slate-100 animate-pulse flex items-center justify-center">
            <Layers className="h-8 w-8 text-slate-100" />
        </div>
        <div className="h-80 bg-white rounded-[3.5rem] border border-slate-100 animate-pulse" />
      </div>
    </div>
  );
}
