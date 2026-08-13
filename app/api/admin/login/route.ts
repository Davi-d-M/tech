import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/adminAuth';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => '');
  let parsedBody: { password?: string, email?: string, mode?: 'pin' | 'email' | 'staff_pin' | 'rider', phone?: string } = {};

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = {};
    }
  }

  const { password, email, mode = 'pin', phone } = parsedBody;

  // Get User IP for Targeted Security
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // 1. PIN Login Mode (Master Admin / Owner)
  if (mode === 'pin') {
    const configuredPassword = process.env.ADMIN_PASSWORD?.trim() || 'apexstores';

    if (!supabase) {
        return NextResponse.json({ error: 'Database connection failed.' }, { status: 500 });
    }

    // Check for recent failed attempts FROM THIS IP ONLY
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: failCount } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('success', false)
        .eq('ip_address', ip) // NEW: IP Isolation
        .gt('attempt_time', fifteenMinsAgo);

    if (failCount && failCount >= 5) {
        return NextResponse.json({
            error: 'Security Lockout: Too many failed attempts. Try again in 15 minutes.'
        }, { status: 429 });
    }

    if (!password) {
      return NextResponse.json({ error: 'PIN is required.' }, { status: 400 });
    }

    const isMatch = password === configuredPassword;

    // Log the attempt with IP metadata
    await supabase.from('login_attempts').insert([{ success: isMatch, ip_address: ip }]);

    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    // On success, clear the fail logs FOR THIS IP
    await supabase.from('login_attempts').delete().eq('success', false).eq('ip_address', ip);

    // Owner has all permissions
    const ownerPermissions = {
        can_view_revenue: true,
        can_manage_inventory: true,
        can_manage_orders: true,
        can_delete_items: true,
        can_manage_blog: true,
        can_manage_affiliates: true,
        can_manage_customer_care: true,
        can_manage_broadcast: true,
        can_manage_settings: true,
        can_manage_media: true
    };

    const response = NextResponse.json({ ok: true, role: 'owner' });
    response.cookies.set('admin_session', createSessionCookie('owner', ownerPermissions), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  // 2. Email Login Mode (Staff)
  if (mode === 'email') {
    if (!email || !password || !supabase) {
        return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    });

    if (authError || !data.user) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('role, can_view_revenue, can_manage_inventory, can_manage_orders, can_delete_items, can_manage_blog, can_manage_affiliates, can_manage_customer_care, can_manage_broadcast, can_manage_settings, can_manage_media')
        .eq('id', data.user.id)
        .maybeSingle();

    if (staffError || !staffData) {
        return NextResponse.json({ error: 'Access denied. You do not have admin or staff permissions.' }, { status: 403 });
    }

    const permissions = {
        can_view_revenue: staffData.can_view_revenue,
        can_manage_inventory: staffData.can_manage_inventory,
        can_manage_orders: staffData.can_manage_orders,
        can_delete_items: staffData.can_delete_items,
        can_manage_blog: staffData.can_manage_blog,
        can_manage_affiliates: staffData.can_manage_affiliates,
        can_manage_customer_care: staffData.can_manage_customer_care,
        can_manage_broadcast: staffData.can_manage_broadcast,
        can_manage_settings: staffData.can_manage_settings,
        can_manage_media: staffData.can_manage_media
    };

    const response = NextResponse.json({ ok: true, role: staffData.role });
    response.cookies.set('admin_session', createSessionCookie(staffData.role, permissions), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  // 3. Staff PIN Login Mode
  if (mode === 'staff_pin') {
    if (!email || !password || !supabase) {
        return NextResponse.json({ error: 'Email and PIN required.' }, { status: 400 });
    }

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: failCount } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('success', false)
        .eq('ip_address', ip)
        .gt('attempt_time', fifteenMinsAgo);

    if (failCount && failCount >= 10) {
        return NextResponse.json({
            error: 'Security Lockout: Too many failed attempts. Try again in 15 minutes.'
        }, { status: 429 });
    }

    const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, role, pin, can_view_revenue, can_manage_inventory, can_manage_orders, can_delete_items, can_manage_blog, can_manage_affiliates, can_manage_customer_care, can_manage_broadcast, can_manage_settings, can_manage_media')
        .eq('email', (email || '').trim().toLowerCase())
        .single();

    if (staffError || !staffData) {
        await supabase.from('login_attempts').insert([{ success: false, ip_address: ip }]);
        return NextResponse.json({ error: 'Access denied or invalid account.' }, { status: 403 });
    }

    if (!staffData.pin || staffData.pin !== password) {
        await supabase.from('login_attempts').insert([{ success: false, ip_address: ip }]);
        return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    await supabase.from('login_attempts').insert([{ success: true, ip_address: ip }]);
    await supabase.from('login_attempts').delete().eq('success', false).eq('ip_address', ip);

    const permissions = {
        can_view_revenue: staffData.can_view_revenue,
        can_manage_inventory: staffData.can_manage_inventory,
        can_manage_orders: staffData.can_manage_orders,
        can_delete_items: staffData.can_delete_items,
        can_manage_blog: staffData.can_manage_blog,
        can_manage_affiliates: staffData.can_manage_affiliates,
        can_manage_customer_care: staffData.can_manage_customer_care,
        can_manage_broadcast: staffData.can_manage_broadcast,
        can_manage_settings: staffData.can_manage_settings,
        can_manage_media: staffData.can_manage_media
    };

    const response = NextResponse.json({ ok: true, role: staffData.role });
    response.cookies.set('admin_session', createSessionCookie(staffData.role, permissions), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  // 4. Rider Login Mode
  if (mode === 'rider') {
    if (!phone || !password || !supabase) {
        return NextResponse.json({ error: 'Phone and PIN required.' }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/^\+254/, '').replace(/^0/, '').trim();

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: failCount } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('success', false)
        .eq('ip_address', ip)
        .gt('attempt_time', fifteenMinsAgo);

    if (failCount && failCount >= 10) {
        return NextResponse.json({
            error: 'Security Lockout: Too many failed attempts. Try again in 15 minutes.'
        }, { status: 429 });
    }

    const { data: riderData, error: riderError } = await supabase
        .from('rider_status')
        .select('id, rider_phone, pin, verification_status')
        .eq('rider_phone', normalizedPhone)
        .maybeSingle();

    if (riderError || !riderData) {
        await supabase.from('login_attempts').insert([{ success: false, ip_address: ip }]);
        return NextResponse.json({ error: 'Rider not found or unauthorized.' }, { status: 403 });
    }

    if (riderData.pin !== password) {
        await supabase.from('login_attempts').insert([{ success: false, ip_address: ip }]);
        return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    if (riderData.verification_status !== 'Verified') {
        return NextResponse.json({
            error: `Tactical Alert: Your account status is ${riderData.verification_status || 'Pending'}. Access restricted until Admin Approval.`
        }, { status: 403 });
    }

    await supabase.from('login_attempts').insert([{ success: true, ip_address: ip }]);
    await supabase.from('login_attempts').delete().eq('success', false).eq('ip_address', ip);

    return NextResponse.json({ ok: true, role: 'rider' });
  }

  return NextResponse.json({ error: 'Invalid login mode.' }, { status: 400 });
}
