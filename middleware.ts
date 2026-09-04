import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/adminAuth';

import { isGhostPath } from '@/lib/ghost/paths';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 0. AFFILIATE ATTRIBUTION: Capture Referral Code
  const refCode = searchParams.get('ref');
  let response = NextResponse.next();

  if (refCode) {
      // Set the attribution cookie (30 days)
      response.cookies.set('apex_ref_code', refCode, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 Days
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
      });
  }

  // GHOST PROTOCOL: Check for Cloak Access
  const ghostCookie = request.cookies.get('ghost_access')?.value;

  if (isGhostPath(pathname)) {
      if (ghostCookie !== 'authorized') {
          return NextResponse.rewrite(new URL('/404', request.url));
      }
  }

  // 1. Protected Paths
  const isAdminPath = pathname.startsWith('/admin');
  const isSupplierPath = pathname.startsWith('/supplier');
  const isRiderPath = pathname.startsWith('/rider');

  if ((isAdminPath || isSupplierPath || isRiderPath) && !pathname.includes('.')) {
    try {
      const sessionCookie = request.cookies.get('admin_session')?.value;
      const sessionData = await verifySessionCookie(sessionCookie);

      if (!sessionData) {
        // STEALTH: Admin/Staff stay cloaked (404)
        if (isAdminPath) {
          return NextResponse.rewrite(new URL('/404', request.url));
        }
        // RIDER & SUPPLIER: Easy access redirect
        const loginPath = isRiderPath ? '/rider/login' : '/supplier/login';

        // If we are redirecting, we still want to keep the cookie we might have set
        const redirectRes = NextResponse.redirect(new URL(loginPath, request.url));
        if (refCode) redirectRes.cookies.set('apex_ref_code', refCode, { path: '/', maxAge: 60 * 60 * 24 * 30 });
        return redirectRes;
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
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/supplier/:path*', '/rider/:path*'],
};
