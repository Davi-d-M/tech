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

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  const sessionData = verifySessionCookie(sessionCookie);

  if (!sessionData) {
    redirect('/admin/login');
  }

  // Fetch the current user session to get the email
  let userEmail = 'Master Admin';
  if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
          userEmail = session.user.email;
      }
  }

  return (
    <AdminLayoutClient
        role={sessionData.role}
        email={userEmail}
        permissions={sessionData.permissions as unknown as Permissions}
    >
      {children}
    </AdminLayoutClient>
  );
}
