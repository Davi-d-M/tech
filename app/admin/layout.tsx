import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { verifySessionCookie } from '@/lib/adminAuth';
import AdminLayoutClient from './layout-client';

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

  if (!verifySessionCookie(sessionCookie)) {
    redirect('/admin/login');
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
