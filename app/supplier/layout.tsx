import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import { verifySessionCookie } from '@/lib/adminAuth';
import { Permissions } from '@/context/AdminContext';
import SupplierLayoutClient from './layout-client';

export const metadata = {
  robots: 'noindex, nofollow',
  title: 'Apexstores | Supplier Portal',
};

export const dynamic = 'force-dynamic';

export default async function SupplierLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let sessionData = null;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session')?.value;
    sessionData = await verifySessionCookie(sessionCookie);
  } catch (err) {
    console.error("Supplier Layout Auth Error:", err);
  }

  if (!sessionData || (sessionData.role !== 'supplier' && sessionData.role !== 'owner' && sessionData.role !== 'admin')) {
    redirect('/admin/login');
  }

  // Fetch the current user session (Server-side)
  let userEmail = 'Supply Partner';
  if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
          userEmail = user.email;
      }
  }

  return (
    <SupplierLayoutClient
        role={sessionData.role as any}
        email={userEmail}
        permissions={sessionData.permissions as unknown as Permissions}
        supplier_id={sessionData.supplier_id}
    >
      {children}
    </SupplierLayoutClient>
  );
}
