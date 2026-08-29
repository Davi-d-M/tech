import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/adminAuth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protected Paths
  const isAdminPath = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isSupplierPath = pathname.startsWith('/supplier');

  if ((isAdminPath || isSupplierPath) && !pathname.includes('.')) {
    try {
      const sessionCookie = request.cookies.get('admin_session')?.value;
      const sessionData = await verifySessionCookie(sessionCookie);

      if (!sessionData) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // 1.5 SHIELD: Lockdown Admin APIs to Owners/Admins Only
      if (pathname.startsWith('/api/admin') && sessionData.role !== 'owner' && sessionData.role !== 'admin') {
          return NextResponse.json({ error: "Access Denied: Admin Clearance Required" }, { status: 403 });
      }

      // 2. Role-Based Routing
      // Prevent Suppliers from entering Admin
      if (isAdminPath && sessionData.role === 'supplier') {
        return NextResponse.redirect(new URL('/supplier', request.url));
      }

      // Prevent Staff from entering Supplier (unless Owner/Admin)
      if (isSupplierPath && sessionData.role === 'staff') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

    } catch (err) {
      console.error("Middleware Auth Error:", err);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/supplier/:path*'],
};
