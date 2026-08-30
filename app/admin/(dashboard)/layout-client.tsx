'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Store,
  Globe,
  Tag,
  Star,
  ShieldCheck,
  ShieldAlert as SecurityIcon,
  Zap,
  Bot,
  History as HistoryIcon,
  Settings,
  Target,
  Trophy,
  TrendingUp,
  Rocket,
  DollarSign,
  Truck,
  CreditCard,
  Search,
  Bell,
  Activity,
  Plus,
  Share2,
  Layout as LayoutIcon,
  Lock,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AdminProvider, Permissions } from '@/context/AdminContext';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';
import GlobalCommandPalette from '@/components/admin/GlobalCommandPalette';
import LiveActivitySidebar from '@/components/admin/LiveActivitySidebar';
import NotificationCenter from '@/components/admin/NotificationCenter';
import { logAuditAction } from '@/lib/auditService';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  role: 'owner' | 'admin' | 'staff' | 'supplier' | 'viewer';
  email: string;
  permissions: Permissions;
  supplier_id?: string | null;
}

export default function AdminLayoutClient({
  children,
  role,
  email,
  permissions,
  supplier_id,
}: AdminLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
      const savedSidebar = localStorage.getItem('admin_sidebar_collapsed');

      if (savedSidebar === 'true') {
          setIsSidebarCollapsed(true);
      }

      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
              e.preventDefault();
              setIsSearchOpen(true);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebarCollapse = () => {
      const next = !isSidebarCollapsed;
      setIsSidebarCollapsed(next);
      localStorage.setItem('admin_sidebar_collapsed', String(next));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logAuditAction(email, 'OS_SESSION_END', { duration: 'calculated-on-server' });
      document.cookie = 'admin_session=; path=/; max-age=0';
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || isOwner;

  const allNavItems = [
    { group: 'COMMAND CENTER', items: [
      { name: 'Today Console', href: '/admin', icon: LayoutDashboard, minRole: 'viewer' },
    ]},
    { group: 'COMMERCE', items: [
      { name: 'Inventory Hub', href: '/admin/upload', icon: Package, permission: 'can_manage_inventory' },
      { name: 'Orders Pipeline', href: '/admin/orders', icon: ShoppingCart, permission: 'can_manage_orders' },
    ]},
    { group: 'OPERATIONS', items: [
      { name: 'Live Dispatch', href: '/admin/dispatch', icon: Truck, permission: 'can_manage_orders' },
      { name: 'Tasks Board', href: '/admin/operations/tasks', icon: LayoutIcon, permission: 'can_manage_orders' },
      { name: 'Partners Node', href: '/admin/operations/vendors', icon: Store, permission: 'can_manage_settings' },
      { name: 'Sourcing Bridge', href: '/admin/operations/sourcing', icon: Globe, permission: 'can_manage_inventory' },
      { name: 'Suppliers', href: '/admin/operations/suppliers', icon: Zap, permission: 'can_manage_inventory' },
    ]},
    { group: 'CUSTOMERS', items: [
      { name: 'Directory', href: '/admin/customers', icon: Users, permission: 'can_manage_customer_care' },
      { name: 'Support Inbox', href: '/admin/messages', icon: MessageSquare, permission: 'can_manage_customer_care' },
      { name: 'Reviews Hub', href: '/admin/reviews', icon: Star, permission: 'can_manage_customer_care' },
      { name: 'Loyalty Logic', href: '/admin/gamification', icon: Trophy, permission: 'can_manage_settings' },
    ]},
    { group: 'GROWTH', items: [
      { name: 'Social Hub', href: '/admin/marketing/social-hub', icon: Share2, permission: 'can_manage_broadcast' },
      { name: 'Marketing Hub', href: '/admin/marketing', icon: TrendingUp, permission: 'can_manage_broadcast' },
      { name: 'AI Ad Agency', href: '/admin/marketing/ai-agency', icon: Target, permission: 'can_manage_broadcast' },
      { name: 'Autopilot', href: '/admin/marketing/automation', icon: Rocket, permission: 'can_manage_broadcast' },
      { name: 'Affiliates', href: '/admin/affiliates', icon: Target, permission: 'can_manage_affiliates' },
      { name: 'Promotions', href: '/admin/coupons', icon: Tag, permission: 'can_manage_broadcast' },
    ]},
    { group: 'FINANCE', items: [
      { name: 'Finance Fortress', href: '/admin/finance', icon: DollarSign, permission: 'can_view_revenue' },
      { name: 'Payout Requests', href: '/admin/payouts', icon: CreditCard, permission: 'can_view_revenue' },
      { name: 'Document Vault', href: '/admin/vault', icon: Lock, permission: 'can_view_revenue' },
    ]},
    { group: 'INTELLIGENCE', items: [
      { name: 'Intelligence Hub', href: '/admin/analytics/intelligence', icon: Zap, permission: 'can_view_revenue' },
      { name: 'Deep Analytics', href: '/admin/analytics', icon: Activity, permission: 'can_view_revenue' },
      { name: 'AI Command Log', href: '/admin/messages?filter=ai', icon: Bot, permission: 'can_manage_customer_care' },
    ]},
    { group: 'ENTERPRISE', items: [
      { name: 'Staff Control', href: '/admin/staff', icon: ShieldCheck, minRole: 'owner' },
      { name: 'System Audit', href: '/admin/audit', icon: HistoryIcon, permission: 'can_view_revenue' },
      { name: 'Security Hub', href: '/admin/security', icon: SecurityIcon, permission: 'can_manage_settings' },
      { name: 'Brand Settings', href: '/admin/settings', icon: Settings, permission: 'can_manage_settings' },
    ]},
  ];

  const visibleNavGroups = allNavItems.map(group => ({
      ...group,
      items: group.items.filter(item => {
          if (!role) return false;
          if (isOwner) return true;
          if (item.minRole === 'viewer') return true;
          if (item.permission && permissions && permissions[item.permission as keyof Permissions]) return true;
          if (item.minRole === 'admin') return isAdmin;
          if (item.minRole === 'owner') return isOwner;
          return false;
      })
  })).filter(group => group.items.length > 0);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <AdminProvider role={role} email={email} permissions={permissions} supplier_id={supplier_id}>
      <AdminErrorBoundary>
          <div className="min-h-screen bg-background flex flex-col md:flex-row text-left">

          <GlobalCommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
          <LiveActivitySidebar isOpen={isActivityOpen} setIsOpen={setIsActivityOpen} />
          <NotificationCenter isOpen={isNotificationsOpen} setIsOpen={setIsNotificationsOpen} />

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between px-4 py-4 bg-background border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-xl bg-background/80">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-foreground uppercase tracking-tighter text-sm">Apex Admin</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-foreground" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                  {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className={cn(
            "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out md:relative shadow-sm border-r border-border bg-background",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}>
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
                <div className={cn("p-8 border-b border-border flex items-center justify-between", isSidebarCollapsed && "p-6")}>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="animate-in fade-in duration-500">
                          <select className="font-black text-foreground leading-none uppercase tracking-tighter text-sm bg-transparent border-none outline-none appearance-none cursor-pointer">
                              <option>Apex Master</option>
                              <option>TechPax Budget</option>
                              <option>Global Wholesale</option>
                          </select>
                          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">Nexus Command</p>
                        </div>
                    )}
                </div>
                {!isSidebarCollapsed && (
                    <button onClick={toggleSidebarCollapse} className="text-muted-foreground hover:text-primary transition-colors hidden md:block">
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                )}
              </div>

              {/* Nav Links */}
              <nav className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
                {visibleNavGroups.map((group) => (
                  <div key={group.group} className="space-y-3">
                    {!isSidebarCollapsed && (
                      <p className="px-5 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        {group.group}
                      </p>
                    )}
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          title={isSidebarCollapsed ? item.name : ""}
                          onClick={() => setIsSidebarOpen(false)}
                          className={cn(
                            "flex items-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group",
                            isSidebarCollapsed ? "justify-center p-3.5" : "gap-4 px-5 py-3",
                            isActive(item.href)
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-slate-400 hover:bg-slate-50 hover:text-foreground"
                          )}
                        >
                          <item.icon className={cn(
                            "h-4 w-4 transition-colors shrink-0",
                            isActive(item.href) ? "text-white" : "text-slate-300 group-hover:text-slate-500"
                          )} />
                          {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-border">
                <Button
                  variant="ghost"
                  className={cn(
                      "w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]",
                      isSidebarCollapsed ? "justify-center px-0" : "gap-4 px-5"
                  )}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-5 w-5" />
                  {!isSidebarCollapsed && (isLoggingOut ? 'Leaving...' : 'Logout')}
                </Button>

                {isSidebarCollapsed ? (
                    <button onClick={toggleSidebarCollapse} className="mt-6 w-full flex justify-center text-muted-foreground hover:text-primary transition-all">
                        <PanelLeftOpen className="h-5 w-5" />
                    </button>
                ) : (
                    <div className="mt-6 p-4 bg-secondary rounded-3xl flex items-center gap-4 border border-border">
                      <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20 shrink-0">
                          {(role || 'A').substring(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-black text-foreground uppercase text-[10px] tracking-tight truncate">{role || 'Admin'}</p>
                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5 truncate">{email || 'Not Signed In'}</p>
                      </div>
                    </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/50">

              {/* TOP NAVIGATION BAR */}
              <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 shrink-0 z-40 hidden md:flex sticky top-0">
                  <div className="flex items-center gap-6">
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-4 px-6 h-12 rounded-2xl bg-secondary border border-border text-muted-foreground hover:border-primary/30 transition-all group min-w-[400px]"
                      >
                          <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Search Protocol...</span>
                          <kbd className="ml-auto bg-background px-2 py-1 rounded-lg border border-border text-[8px] font-black text-muted-foreground group-hover:text-primary transition-colors">Ctrl + K</kbd>
                      </button>
                  </div>

                  <div className="flex items-center gap-4">
                      <Button onClick={() => setIsActivityOpen(true)} variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 relative">
                          <Activity className="h-5 w-5" />
                      </Button>

                      <Button onClick={() => setIsNotificationsOpen(true)} variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 relative">
                          <Bell className="h-5 w-5" />
                          <span className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full border-2 border-background"></span>
                      </Button>

                      <div className="h-6 w-px bg-border mx-2"></div>

                      <Link href="/admin/upload">
                          <Button className="h-12 px-6 rounded-2xl bg-primary text-white font-black uppercase text-[9px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                              <Plus className="h-4 w-4" /> Quick Deployment
                          </Button>
                      </Link>
                  </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 sm:p-10 no-scrollbar relative scroll-smooth">
                <div className="max-w-[1600px] mx-auto w-full space-y-10">
                  {children}
                </div>
              </main>
          </div>
        </div>
      </AdminErrorBoundary>
    </AdminProvider>
  );
}
