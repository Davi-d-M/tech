import { revalidateTag, revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/adminAuth';

/**
 * APEX OS: Global CDN Cache Refresh Protocol
 * Purges the server-side and edge-layer cache for settings and products.
 */
export async function POST(request: Request) {
    try {
        const sessionCookie = request.headers.get('cookie')
            ?.split('; ')
            .find(row => row.startsWith('admin_session='))
            ?.split('=')[1];

        const session = await verifySessionCookie(sessionCookie);

        if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
            return NextResponse.json({ error: "Unauthorized: High-level clearance required." }, { status: 401 });
        }

        const { type } = await request.json();

        if (type === 'all' || type === 'settings') {
            revalidateTag('settings');
            revalidateTag('store-settings-v5');
        }

        if (type === 'all' || type === 'products') {
            revalidateTag('products');
            revalidateTag('home-data-v5');
        }

        if (type === 'all') {
            revalidatePath('/');
            revalidatePath('/shop');
        }

        return NextResponse.json({
            success: true,
            message: `CDN synchronization complete for payload type: ${type.toUpperCase()}`,
            timestamp: new Date().toISOString()
        });
    } catch (err: unknown) {
        console.error("Revalidation Failure:", err);
        return NextResponse.json({ error: "CDN synchronization failed." }, { status: 500 });
    }
}
