'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  LogOut,
  Menu,
  X,
  Store,
  Plus,
  Box,
  Truck,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AdminProvider, Permissions } from '@/context/AdminContext';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';

interface SupplierLayoutClientProps {
  children: React.ReactNode;
  role: 'owner' | 'admin' | 'staff' | 'supplier' | 'viewer';
  email: string;
  permissions: Permissions;
  supplier_id?: string | null;
}

export default function SupplierLayoutClient({
  children,
  role,
  email,
  permissions,
  supplier_id,
}: SupplierLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    document.cookie = 'admin_session=; path=/; max-age=0';
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/supplier', icon: LayoutDashboard },
    { name: 'Stock Pulse', href: '/supplier/inventory', icon: Box },
    { name: 'Propose Gadget', href: '/supplier/propose', icon: Plus },
  ];

  const isActive = (href: string) => {
    if (href === '/supplier') return pathname === '/supplier';
    return pathname.startsWith(href);
  };

  return (
    <AdminProvider role={role} email={email} permissions={permissions} supplier_id={supplier_id}>
      <AdminErrorBoundary>
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-left">

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-foreground uppercase tracking-tighter text-sm">Supplier Hub</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Sidebar */}
          <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="h-full flex flex-col">
              <div className="p-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-foreground leading-none uppercase tracking-tighter text-lg">TechPax</h2>
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">Partner Portal</p>
                    </div>
                </div>
              </div>

              <nav className="flex-1 px-6 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      isActive(item.href)
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-slate-400 hover:bg-slate-50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="p-8 border-t border-slate-50">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-4 px-6 h-12 text-slate-400 hover:text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-5 w-5" />
                  {isLoggingOut ? 'Leaving...' : 'Logout'}
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-[1600px] mx-auto w-full">
            {children}
          </main>

        </div>
      </AdminErrorBoundary>
    </AdminProvider>
  );
}
