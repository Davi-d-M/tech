import { supabase } from './supabaseClient';

/**
 * Logs a staff action for accountability with enterprise metadata
 */
export async function logAuditAction(email: string, action: string, details: Record<string, unknown>) {
  if (!supabase || !email) return;

  try {
    // Attempt to get IP from multiple sources
    let ip = 'server-internal';

    if (typeof window !== 'undefined') {
        try {
            // Try ipify first
            const res = await fetch('https://api.ipify.org?format=json', { timeout: 2000 } as any);
            if (res.ok) {
                const data = await res.json();
                ip = data.ip;
            } else {
                // Try second source if ipify fails
                const res2 = await fetch('https://ifconfig.me/all.json');
                const data2 = await res2.json();
                ip = data2.ip_addr;
            }
        } catch { ip = 'client-unreachable'; }
    }

    // Parse User Agent for elite display
    let deviceInfo = 'Titan Node';
    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) deviceInfo = 'Windows Desktop';
        else if (ua.includes('iPhone') || ua.includes('iPad')) deviceInfo = 'iOS Device';
        else if (ua.includes('Android')) deviceInfo = 'Android Mobile';
        else if (ua.includes('Macintosh')) deviceInfo = 'Mac OS X';
        else if (ua.includes('Linux')) deviceInfo = 'Linux Node';
        else deviceInfo = ua.substring(0, 30);
    }

    await supabase
      .from('audit_logs')
      .insert([{
        staff_email: email,
        action,
        details,
        ip_address: ip,
        device_info: deviceInfo,
        created_at: new Date().toISOString()
      }]);
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
}
