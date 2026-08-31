'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  History,
  Search,
  RefreshCcw,
  ShieldCheck,
  Activity,
  Package,
  Shield,
  Trash,
  PlusCircle,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface AuditLog {
  id: number;
  staff_email: string;
  action: string;
  details: Record<string, unknown> | null;
  ip_address?: string;
  device_info?: string;
  created_at: string;
}

interface LogDetails {
  name?: string;
  stock?: number;
  price?: number;
  initial_stock?: number;
  id?: number;
  newStatus?: string;
  count?: number;
  rider?: string;
  current_location?: string;
  email?: string;
  role?: string;
  field?: string;
  value?: unknown;
}

function DetailRenderer({ log }: { log: AuditLog }) {
    const d = log.details as LogDetails;
    if (!d) return null;

    switch (log.action) {
        case 'UPDATE_PRODUCT':
            return (
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-black text-foreground uppercase">Restocked: {d.name}</p>
                    <div className="flex gap-4">
                        <span className="text-[10px] font-bold text-primary uppercase">Stock: {d.stock} Units</span>
                        <span className="text-[10px] font-bold text-primary uppercase">Price: {formatPrice(d.price)}</span>
                    </div>
                </div>
            );
        case 'CREATE_PRODUCT':
            return (
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-black text-primary uppercase">New Gadget: {d.name}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Initial: {d.initial_stock} Units @ {formatPrice(d.price)}</span>
                </div>
            );
        case 'UPDATE_ORDER_STATUS':
            return (
                <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-slate-400" />
                    <p className="text-xs font-bold text-foreground uppercase">Order #{d.id} set to <span className="text-primary font-black">{d.newStatus}</span></p>
                </div>
            );
        case 'BULK_UPDATE_ORDERS':
            return (
                <div className="flex items-center gap-2">
                    <History className="h-3 w-3 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase">Bulk Updated <span className="text-primary font-black">{d.count} Orders</span> to {d.newStatus}</p>
                </div>
            );
        case 'ASSIGN_RIDER':
            return (
                <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase">Rider <span className="text-foreground font-black">{d.rider}</span> assigned to #{d.id}</p>
                </div>
            );
        case 'UPDATE_RIDER_STATUS':
            return (
                <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase">Rider <span className="text-foreground font-black">{d.rider}</span> moved to <span className="text-primary font-black">{d.current_location}</span></p>
                </div>
            );
        case 'ADD_STAFF':
            return (
                <div className="flex items-center gap-2">
                    <PlusCircle className="h-3 w-3 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase">Authorized <span className="text-foreground font-black">{d.email}</span> as {d.role}</p>
                </div>
            );
        case 'UPDATE_PERMISSION':
            return (
                <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-amber-500" />
                    <p className="text-xs font-bold text-foreground uppercase">Toggle <span className="text-amber-600 font-black">{d.field}</span> to {String(d.value)}</p>
                </div>
            );
        case 'REMOVE_STAFF':
            return (
                <div className="flex items-center gap-2 text-rose-600">
                    <Trash className="h-3 w-3" />
                    <p className="text-xs font-black uppercase tracking-tighter italic">Revoked access for {d.email}</p>
                </div>
            );
        default:
            return (
                <p className="text-[10px] font-medium text-slate-400 font-mono truncate">
                    {typeof d === 'object' ? JSON.stringify(d) : String(d)}
                </p>
            );
    }
}

export default function AdminAuditPage() {
  const { role, permissions, tenant_id } = useAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (role !== 'owner' && tenant_id) {
          query = query.eq('tenant_id', tenant_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tenant_id]);

  const clearLogs = async () => {
      if (!supabase || !confirm("Clear all audit history? This cannot be undone.")) return;
      try {
          const { error } = await supabase.from('audit_logs').delete().neq('id', 0); // Delete all
          if (error) throw error;
          setLogs([]);
      } catch (err) {
          console.error(err);
      }
  };

  const filteredLogs = logs.filter(l =>
    (l.staff_email || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (l.action || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  if (role !== 'owner' && !permissions.can_view_audit_logs) {
      return (
          <div className="p-24 flex flex-col items-center justify-center text-center">
              <Shield className="h-16 w-16 text-rose-500 mb-6" />
              <h2 className="text-2xl font-black uppercase text-foreground">Access Denied</h2>
              <p className="text-slate-500 mt-2">Only the Master Admin can review system audit logs.</p>
          </div>
      );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-left">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">System Audit</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Review administrative actions and maintain operational security.</p>
        </div>
        <div className="flex gap-2">
            {role === 'owner' && (
                <Button onClick={clearLogs} variant="outline" className="rounded-xl h-12 px-6 border-rose-100 text-rose-500 hover:bg-rose-50 font-black uppercase text-[10px]">
                    Clear History
                </Button>
            )}
            <Button onClick={fetchLogs} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest">
                <RefreshCcw className="h-4 w-4 mr-2" /> Sync
            </Button>
        </div>
      </header>

      <div className="relative">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by admin email or action..."
            className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Activity Stream</h2>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">{filteredLogs.length} Events</span>
          </div>

          {loading ? (
              <div className="p-32 text-center flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Retrieving Logs...</p>
              </div>
          ) : filteredLogs.length === 0 ? (
              <div className="p-32 text-center flex flex-col items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-100"><ShieldCheck className="h-10 w-10" /></div>
                  <p className="text-lg font-black text-slate-300 uppercase tracking-tight italic">No activity recorded yet.</p>
              </div>
          ) : (
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                              <th className="px-10 py-6">Admin</th>
                              <th className="px-10 py-6">Action</th>
                              <th className="px-10 py-6">Details</th>
                              <th className="px-10 py-6 text-right">Time</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {filteredLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-10 py-8">
                                      <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                                              {(log?.staff_email?.substring(0, 2) || 'AD').toUpperCase()}
                                          </div>
                                          <div>
                                              <span className="font-black text-foreground uppercase text-[11px] block whitespace-nowrap">{log.staff_email || 'System'}</span>
                                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 block whitespace-nowrap">
                                                  {log.ip_address || '0.0.0.0'} &bull; {log.device_info || 'Unknown'}
                                              </span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-10 py-8">
                                      <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 whitespace-nowrap shadow-sm">
                                          {(log?.action || 'ACTIVITY').replace(/_/g, ' ')}
                                      </span>
                                  </td>
                                  <td className="px-10 py-8 min-w-[300px]">
                                      <div className="max-w-md">
                                          <DetailRenderer log={log} />
                                      </div>
                                  </td>
                                  <td className="px-10 py-8 text-right">
                                      <p className="text-xs font-black text-foreground uppercase tracking-tighter">{log?.created_at ? new Date(log.created_at).toLocaleTimeString() : 'N/A'}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">{log?.created_at ? new Date(log.created_at).toLocaleDateString() : 'N/A'}</p>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
    </div>
  );
}
