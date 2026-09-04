import { NextResponse } from 'next/server';

const GHOST_KEY = process.env.ADMIN_GHOST_KEY || 'apex-ghost-99';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const target = searchParams.get('to') || '/apex-portal';

    if (key !== GHOST_KEY) {
        // Return 404 to hide the gateway's existence
        return new Response(null, { status: 404 });
    }

    const response = NextResponse.redirect(new URL(target, request.url));

    // Set the Ghost Access cookie (1 day)
    response.cookies.set('ghost_access', 'authorized', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    return response;
}
