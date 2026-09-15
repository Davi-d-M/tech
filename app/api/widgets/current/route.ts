import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Apex OS: Intelligent Widget Endpoint
 * Returns the highest priority active widget for the requesting device.
 */
export async function GET(request: Request) {
    if (!supabase) return NextResponse.json({ error: "DB Link Offline" }, { status: 500 });

    try {
        const { searchParams } = new URL(request.url);
        const segment = searchParams.get('segment') || 'ALL';

        const { data: widget, error } = await supabase
            .from('app_widgets')
            .select('*')
            .eq('is_enabled', true)
            .lte('starts_at', new Date().toISOString())
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .or(`target_segment.eq.ALL,target_segment.eq.${segment}`)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !widget) {
            return NextResponse.json({
                title: "Apex stores Kenya",
                description: "Authentic tech delivered instantly.",
                destination: "/"
            });
        }

        return NextResponse.json(widget);
    } catch (err) {
        console.error("Widget Fetch Failure:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
