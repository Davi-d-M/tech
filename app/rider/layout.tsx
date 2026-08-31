import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/adminAuth';
import { AdminProvider, Permissions } from '@/context/AdminContext';

export const metadata = {
  robots: 'noindex, nofollow',
  title: 'Apex Titan | Rider Console',
};

export const dynamic = 'force-dynamic';

export default async function RiderLayout({
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
    console.error("Rider Layout Session Error:", err);
  }

  // If not a rider or no session, redirect to login
  if (!sessionData || sessionData.role !== 'rider') {
    redirect('/admin/login');
  }

  return (
    <AdminProvider
        role="rider"
        email={sessionData.email}
        tenant_id={sessionData.tenant_id}
        permissions={sessionData.permissions as unknown as Permissions}
    >
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </AdminProvider>
  );
}
