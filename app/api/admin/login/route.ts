import { NextResponse } from 'next/server';

import { createSessionCookie } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => '');
  let parsedBody: { password?: unknown } = {};

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as { password?: unknown };
    } catch {
      parsedBody = {};
    }
  }

  const password = typeof parsedBody.password === 'string' ? parsedBody.password.trim() : '';
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  const expectedPassword = configuredPassword || 'apexstores';

  if (!password) {
    return NextResponse.json(
      { error: 'PIN is required. Please enter your admin PIN.' },
      { status: 400 }
    );
  }

  if (password !== expectedPassword) {
    return NextResponse.json(
      { error: 'Incorrect PIN. Please try again.' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', createSessionCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return response;
}
