import { supabase } from './supabaseClient';

/**
 * Logs a staff action for accountability with enterprise metadata
 */
export async function logAuditAction(email: string, action: string, details: Record<string, unknown>) {
  if (!supabase || !email) return;

  try {
    // Attempt to get IP from client side if possible
    let ip = 'server';
    if (typeof window !== 'undefined') {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            ip = data.ip;
        } catch { ip = 'client-unknown'; }
    }

    await supabase
      .from('audit_logs')
      .insert([{
        staff_email: email,
        action,
        details,
        ip_address: ip,
        device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        created_at: new Date().toISOString()
      }]);
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
}
