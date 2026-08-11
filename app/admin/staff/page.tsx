'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  UserPlus,
  Mail,
  Lock,
  RefreshCcw,
  AlertCircle,
  Eye,
  Package,
  ShoppingCart,
  Trash,
  Trophy,
  Zap,
  ArrowUpRight,
  BookOpen,
  Target,
  MessageSquare,
  Send,
  Settings,
  ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatPrice } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface StaffMember {
  id: string;
  email: string;
  role: 'owner' | 'super_admin' | 'admin' | 'finance' | 'operations' | 'support' | 'staff' | 'viewer';
  pin?: string;
  can_view_revenue: boolean;
  can_manage_inventory: boolean;
  can_manage_orders: boolean;
  can_delete_items: boolean;
  can_manage_blog: boolean;
  can_manage_affiliates: boolean;
  can_manage_customer_care: boolean;
  can_manage_broadcast: boolean;
  can_manage_settings: boolean;
  can_manage_media: boolean;
  created_at: string;
}

interface StaffOrder {
    captured_by: string;
    total_price: number;
    status: string;
}

export default function AdminStaffPage() {
  const { email: adminEmail } = useAdmin();
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newEmail, setNewEmail] = React.useState('');
  const [newRole, setNewRole] = React.useState<StaffMember['role']>('staff');
  const [newPin, setNewPin] = React.useState('');

  const [canViewRev, setCanViewRev] = React.useState(false);
  const [canManageInv, setCanManageInv] = React.useState(true);
  const [canManageOrd, setCanManageOrd] = React.useState(true);
  const [canDelItems, setCanDelItems] = React.useState(false);
  const [canManageBlog, setCanManageBlog] = React.useState(false);
  const [canManageAffiliates, setCanManageAffiliates] = React.useState(false);
  const [canManageCustomerCare, setCanManageCustomerCare] = React.useState(false);
  const [canManageBroadcast, setCanManageBroadcast] = React.useState(false);
  const [canManageSettings, setCanManageSettings] = React.useState(false);
  const [canManageMedia, setCanManageMedia] = React.useState(false);

  const [isAdding, setIsAdding] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orders, setOrders] = React.useState<StaffOrder[]>([]);

  const fetchStaffData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [staffRes, ordersRes] = await Promise.all([
          supabase.from('staff').select('*').order('created_at', { ascending: false }),
          supabase.from('orders').select('captured_by, total_price, status').eq('status', 'Delivered')
      ]);

      if (staffRes.error) {
          if (staffRes.error.message.includes('column') && staffRes.error.message.includes('does not exist')) {
              setMessage({ type: 'error', text: "Database schema out of sync." });
          } else {
              throw staffRes.error;
          }
      }
      setStaff((staffRes.data || []) as StaffMember[]);
      setOrders((ordersRes.data || []) as StaffOrder[]);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Failed to load team data.' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStaffData();
  }, []);

  const leaderboard = React.useMemo(() => {
    return staff.map(member => {
        const sales = orders
            .filter(o => o.captured_by === member.email)
            .reduce((sum, o) => sum + (o.total_price || 0), 0);
        return { ...member, totalSales: sales };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [staff, orders]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !supabase) return;

    setIsAdding(true);
    setMessage(null);

    try {
      const { data: userData, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
          email_input: (newEmail || '').trim().toLowerCase()
      });

      if (rpcError || !userData || userData.length === 0) {
          throw new Error("Ask the user to sign up on Apexstores first!");
      }

      const userId = userData[0].id || userData[0].ID;

      const { error } = await supabase
        .from('staff')
        .insert([{
            id: userId,
            email: (newEmail || '').trim().toLowerCase(),
            role: newRole,
            pin: newPin.trim() || null,
            can_view_revenue: canViewRev,
            can_manage_inventory: canManageInv,
            can_manage_orders: canManageOrd,
            can_delete_items: canDelItems,
            can_manage_blog: canManageBlog,
            can_manage_affiliates: canManageAffiliates,
            can_manage_customer_care: canManageCustomerCare,
            can_manage_broadcast: canManageBroadcast,
            can_manage_settings: canManageSettings,
            can_manage_media: canManageMedia
        }]);

      if (error) {
          if (error.code === '23505') throw new Error("This user is already a team member.");
          throw error;
      }

      setMessage({ type: 'success', text: `${newEmail} authorized.` });
      if (adminEmail) await logAuditAction(adminEmail, 'ADD_STAFF', { email: newEmail, role: newRole });
      setNewEmail('');
      setNewPin('');
      fetchStaffData();
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || "Something went wrong." });
    } finally {
      setIsAdding(false);
    }
  };

  const updatePermission = async (id: string, field: string, value: boolean) => {
      if (!supabase) return;
      const { error } = await supabase.from('staff').update({ [field]: value }).eq('id', id);
      if (!error) {
          if (adminEmail) await logAuditAction(adminEmail, 'UPDATE_PERMISSION', { id, field, value });
          setStaff(staff.map(s => s.id === id ? { ...s, [field]: value } : s));
          setMessage({ type: 'success', text: 'Permission updated.' });
      }
  };

  const updateStaffRole = async (id: string, role: 'admin' | 'staff' | 'viewer') => {
      if (!supabase) return;
      const { error } = await supabase.from('staff').update({ role }).eq('id', id);
      if (!error) {
          if (adminEmail) await logAuditAction(adminEmail, 'UPDATE_ROLE', { id, role });
          setStaff(staff.map(s => s.id === id ? { ...s, role: role as StaffMember['role'] } : s));
          setMessage({ type: 'success', text: 'Role updated.' });
      }
  };

  const updateStaffPin = async (id: string, pin: string) => {
      if (!supabase) return;
      const { error } = await supabase.from('staff').update({ pin }).eq('id', id);
      if (!error) {
          if (adminEmail) await logAuditAction(adminEmail, 'UPDATE_PIN', { id });
          setStaff(staff.map(s => s.id === id ? { ...s, pin } : s));
          setMessage({ type: 'success', text: 'PIN updated.' });
      }
  };

  const removeStaff = async (id: string) => {
      if (!supabase) return;

      const member = staff.find(s => s.id === id);
      const { error } = await supabase.from('staff').delete().eq('id', id);

      if (!error) {
          if (adminEmail) await logAuditAction(adminEmail, 'REMOVE_STAFF', { id, email: member?.email });
          setStaff(staff.filter(s => s.id !== id));
          setMessage({ type: 'success', text: 'Staff revoked.' });
          setTimeout(() => setMessage(null), 3000);
      }
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-left selection:bg-primary/20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Command & Control</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage team permissions and granular access levels.</p>
        </div>
        <Button onClick={fetchStaffData} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-lg active:scale-95">
            <RefreshCcw className="h-4 w-4 mr-2" /> Sync Records
        </Button>
      </header>

      <div className="bg-card rounded-[3rem] p-10 border border-border text-foreground relative overflow-hidden shadow-2xl group hover:border-primary/30 transition-all text-left">
          <div className="relative z-10 text-left">
              <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform"><Trophy className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Elite Sales Leaderboard</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border ml-auto">This Month</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                  {leaderboard.length === 0 ? (
                      <p className="text-muted-foreground text-xs font-bold uppercase italic">Awaiting competition data...</p>
                  ) : (
                      leaderboard.slice(0, 4).map((member, i) => (
                          <div key={member.id} className="bg-secondary border border-border rounded-[2rem] p-6 flex items-center gap-4 group/card hover:bg-card hover:shadow-xl transition-all hover:border-primary/10 h-full">
                              <div className="relative shrink-0">
                                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-background font-black text-xs uppercase shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
                                      {member.email.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className={cn(
                                      "absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center border-2 border-background shadow-lg text-[10px] font-black",
                                      i === 0 ? "bg-primary text-background" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-300 text-white" : "bg-muted text-muted-foreground"
                                  )}>
                                      {i + 1}
                                  </div>
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground truncate mb-1">{member.email.split('@')[0]}</p>
                                  <p className="text-xl font-black tracking-tighter text-foreground">{formatPrice(member.totalSales)}</p>
                              </div>
                              <div className="opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <ArrowUpRight className="h-4 w-4 text-primary" />
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
          <Zap className="absolute -bottom-10 -right-10 h-64 w-64 text-primary/5 rotate-12" />
      </div>

      {message && (
          <div className={cn(
              "p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
              message.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/10 border-primary/20 text-primary"
          )}>
              <AlertCircle className="h-5 w-5" />
              <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
          </div>
      )}

      <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-[2.5rem] border border-border p-10 shadow-sm">
                  <h2 className="text-xl font-black text-foreground uppercase mb-6 flex items-center gap-4 tracking-tight">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><UserPlus className="h-5 w-5" /></div>
                      Add Staff
                  </h2>

                  <form onSubmit={handleAddStaff} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                          <div className="relative">
                              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="staff@apexstores.com" className="rounded-2xl h-14 bg-secondary border-border pl-12 text-sm font-bold text-foreground" required />
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Enterprise Role</label>
                            <select
                                value={newRole}
                                onChange={e => setNewRole(e.target.value as any)}
                                className="w-full h-14 px-4 rounded-2xl border border-border bg-secondary text-xs font-black uppercase outline-none text-foreground"
                            >
                                <option value="staff">Staff</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="finance">Finance Ops</option>
                                <option value="operations">Logistics Ops</option>
                                <option value="support">Customer Care</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">PIN</label>
                            <Input
                                maxLength={4}
                                value={newPin}
                                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="1234"
                                className="rounded-2xl h-14 bg-secondary border-border text-sm font-bold text-foreground"
                            />
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-4">Initial Permissions</p>
                          <div className="grid grid-cols-2 gap-3">
                              {[
                                  { label: 'Revenue', state: canViewRev, set: setCanViewRev },
                                  { label: 'Inventory', state: canManageInv, set: setCanManageInv },
                                  { label: 'Orders', state: canManageOrd, set: setCanManageOrd },
                                  { label: 'Delete', state: canDelItems, set: setCanDelItems },
                                  { label: 'Blog', state: canManageBlog, set: setCanManageBlog },
                                  { label: 'Affiliates', state: canManageAffiliates, set: setCanManageAffiliates },
                                  { label: 'Care', state: canManageCustomerCare, set: setCanManageCustomerCare },
                                  { label: 'Broadcast', state: canManageBroadcast, set: setCanManageBroadcast },
                                  { label: 'Settings', state: canManageSettings, set: setCanManageSettings },
                                  { label: 'Media', state: canManageMedia, set: setCanManageMedia },
                              ].map((p) => (
                                  <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => p.set(!p.state)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-[9px] font-black uppercase shadow-sm",
                                        p.state ? "bg-primary text-background border-primary shadow-primary/20" : "bg-card text-muted-foreground border-border hover:border-primary/20 hover:text-primary"
                                    )}
                                  >
                                      {p.label}
                                      {p.state ? <Lock className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <Button type="submit" disabled={isAdding} className="w-full h-16 rounded-[1.5rem] bg-primary text-background font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 mt-4 transition-all hover:scale-105 active:scale-95">
                          {isAdding ? 'Syncing...' : 'Authorize Member'}
                      </Button>
                  </form>
              </div>
          </div>

          <div className="lg:col-span-2">
              <div className="bg-card rounded-[3rem] border border-border shadow-sm overflow-hidden min-h-[500px] text-left">
                  <div className="p-8 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <Users className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Team Directory</h2>
                      </div>
                      <span className="text-[10px] font-black uppercase text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">{staff.length} Members</span>
                  </div>

                  {loading ? (
                      <div className="p-32 text-center flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Awaiting Records...</p>
                      </div>
                  ) : staff.length === 0 ? (
                      <div className="p-32 text-center flex flex-col items-center gap-6">
                          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"><ShieldCheck className="h-10 w-10" /></div>
                          <p className="text-lg font-black text-muted-foreground uppercase tracking-tight italic">No delegated staff accounts found.</p>
                      </div>
                  ) : (
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-secondary text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em]">
                                      <th className="px-8 py-6">Identity</th>
                                      <th className="px-8 py-6">PIN</th>
                                      <th className="px-8 py-6">Permissions</th>
                                      <th className="px-8 py-6 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                  {staff.map(member => (
                                      <tr key={member.id} className="hover:bg-secondary/50 transition-colors group">
                                          <td className="px-8 py-8">
                                              <div className="flex items-center gap-4">
                                                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-background font-black uppercase shadow-lg shadow-primary/10 text-[10px] transition-transform group-hover:scale-110">
                                                      {(member.email || '??').substring(0, 2).toUpperCase()}
                                                  </div>
                                                  <div className="min-w-0">
                                                      <span className="font-black text-foreground uppercase text-xs tracking-tight block truncate">{member.email || 'Unknown'}</span>
                                                      <select
                                                        value={member.role}
                                                        onChange={e => updateStaffRole(member.id, e.target.value as any)}
                                                        className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block italic bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors"
                                                      >
                                                        <option value="staff">Staff</option>
                                                        <option value="super_admin">Super Admin</option>
                                                        <option value="finance">Finance</option>
                                                        <option value="operations">Operations</option>
                                                        <option value="support">Support</option>
                                                        <option value="viewer">Viewer</option>
                                                      </select>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-8 py-8">
                                              <input
                                                type="text"
                                                maxLength={4}
                                                defaultValue={member.pin || ''}
                                                onBlur={(e) => {
                                                    if (e.target.value !== member.pin) {
                                                        updateStaffPin(member.id, e.target.value.replace(/\D/g, ''));
                                                    }
                                                }}
                                                className="w-12 h-8 text-center rounded-lg bg-secondary border-none font-black text-[10px] text-foreground focus:ring-2 focus:ring-primary/20"
                                                placeholder="----"
                                              />
                                          </td>
                                          <td className="px-8 py-8 text-left">
                                              <div className="flex flex-wrap gap-2 max-w-[200px]">
                                                  {[
                                                      { field: 'can_view_revenue', icon: Eye, color: 'primary' as const },
                                                      { field: 'can_manage_inventory', icon: Package, color: 'primary' as const },
                                                      { field: 'can_manage_orders', icon: ShoppingCart, color: 'primary' as const },
                                                      { field: 'can_delete_items', icon: Trash, color: 'primary' as const },
                                                      { field: 'can_manage_blog', icon: BookOpen, color: 'primary' as const },
                                                      { field: 'can_manage_affiliates', icon: Target, color: 'primary' as const },
                                                      { field: 'can_manage_customer_care', icon: MessageSquare, color: 'primary' as const },
                                                      { field: 'can_manage_broadcast', icon: Send, color: 'primary' as const },
                                                      { field: 'can_manage_settings', icon: Settings, color: 'primary' as const },
                                                      { field: 'can_manage_media', icon: ImageIcon, color: 'primary' as const },
                                                  ].map((p) => (
                                                      <button
                                                        key={p.field}
                                                        onClick={() => updatePermission(member.id, p.field, !member[p.field as keyof StaffMember])}
                                                        className={cn(
                                                            "h-8 w-8 rounded-lg flex items-center justify-center transition-all border shrink-0",
                                                            member[p.field as keyof StaffMember]
                                                                ? `bg-primary text-background border-primary`
                                                                : "bg-card text-muted-foreground border-border hover:border-muted-foreground"
                                                        )}
                                                        title={p.field.replace(/_/g, ' ')}
                                                      >
                                                          <p.icon className="h-3.5 w-3.5" />
                                                      </button>
                                                  ))}
                                              </div>
                                          </td>
                                          <td className="px-8 py-8 text-right">
                                              <Button
                                                onClick={() => removeStaff(member.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl text-muted hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                              >
                                                  <Trash2 className="h-4 w-4" />
                                              </Button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
}
