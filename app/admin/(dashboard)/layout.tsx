import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import { verifySessionCookie } from '@/lib/adminAuth';
import AdminLayoutClient from './layout-client';
import { Permissions } from '@/context/AdminContext';

export const metadata = {
  robots: 'noindex, nofollow',
  title: 'Apexstores | Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
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
    console.error("Layout Session Verification Error:", err);
  }

  if (!sessionData) {
    redirect('/apex-portal');
  }

  // Fetch the current user session (Server-side)
  let userEmail = 'Master Admin';
  if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
          userEmail = user.email;
      }
  }

  return (
    <AdminLayoutClient
        role={sessionData.role as 'owner' | 'admin' | 'staff' | 'supplier' | 'viewer' | 'rider'}
        email={userEmail}
        permissions={sessionData.permissions as unknown as Permissions}
        tenant_id={sessionData.tenant_id}
        supplier_id={sessionData.supplier_id}
    >
      {children}
    </AdminLayoutClient>
  );
}
