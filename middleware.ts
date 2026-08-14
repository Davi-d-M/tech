import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'apexstores';

function verifySessionCookie(value?: string) {
  if (!value) return null;

  const [signature, token, base64Payload] = value.split('.');
  if (!signature || !token || !base64Payload) return null;

  const signToken = (t: string) => crypto.createHmac('sha256', SESSION_SECRET).update(t).digest('hex');
  const expectedSignature = signToken(`${token}.${base64Payload}`);

  if (signature !== expectedSignature) return null;

  try {
    return JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🛡️ Shield the Admin Panel
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    const sessionData = verifySessionCookie(sessionCookie);

    if (!sessionData) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
