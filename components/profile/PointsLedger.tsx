'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { History, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LedgerEntry {
  id: number;
  amount: number;
  description: string;
  created_at: string;
}

export default function PointsLedger({ profileId }: { profileId: string }) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLedger() {
      if (!supabase || !profileId) return;
      try {
        const { data } = await supabase
          .from('loyalty_ledger')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        setEntries(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [profileId]);

  if (loading) return <div className="animate-pulse h-20 bg-slate-50 rounded-2xl"></div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm text-left">
      <div className="flex items-center gap-3 mb-8">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Points History</h2>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No transactions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                  entry.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {entry.amount > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-black text-foreground uppercase text-[11px] tracking-tight">{entry.description}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-0.5">
                    <Clock className="h-2 w-2" /> {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={cn(
                "text-sm font-black tracking-tighter",
                entry.amount > 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {entry.amount > 0 ? '+' : ''}{entry.amount}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
