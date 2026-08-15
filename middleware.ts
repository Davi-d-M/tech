import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/adminAuth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🛡️ Shield the Admin Panel
  // Explicitly ignore static files and the login page
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.includes('.')
  ) {
    try {
      const sessionCookie = request.cookies.get('admin_session')?.value;
      const sessionData = await verifySessionCookie(sessionCookie);

      if (!sessionData) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    } catch (err) {
      console.error("Middleware Auth Bypass:", err);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
