import { supabase } from './supabaseClient';

/**
 * Apex OS Audit Interface
 * Transmits actions to the secure server-side logger.
 */
export async function logAuditAction(email: string, action: string, details: Record<string, unknown>) {
  if (!email) return;

  try {
    // 1. Detect Device Info (Frontend Only)
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

    // 2. Transmit to Secure API Node
    // This ensures the IP is captured server-side and the action is authenticated.
    const res = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            action,
            details,
            deviceInfo
        })
    });

    if (!res.ok) {
        console.warn("Audit Transmission Restricted. Falling back to local log...");
        // Minimal fallback for local dev if API is unreachable
        if (supabase) {
             await supabase.from('audit_logs').insert([{
                staff_email: email,
                action,
                details,
                device_info: deviceInfo + ' (Fallback)',
                ip_address: 'client-direct'
             }]);
        }
    }
  } catch (err) {
    console.error("Audit Service Link Unstable:", err);
  }
}
