import { createHmac } from 'crypto';
import { supabase } from '../supabaseClient';

/**
 * Apex OS: Immutability Protocol
 * Generates and verifies tamper-proof digital warranty certificates.
 */
export interface WarrantyCertificate {
    id: string;
    order_id: number;
    sku: string;
    imei_serial: string;
    issued_at: string;
    expiry_at: string;
    hash: string;
    is_valid: boolean;
}

const APEX_IMMUTABILITY_SECRET = process.env.APEX_IMMUTABILITY_SECRET || 'titan-ledger-v1';

export function generateWarrantyHash(payload: string): string {
    return createHmac('sha256', APEX_IMMUTABILITY_SECRET).update(payload).digest('hex');
}

export async function issueDigitalWarranty(orderId: number, sku: string, serial: string) {
    if (!supabase) return;

    const issuedAt = new Date().toISOString();
    const expiryAt = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
    const rawPayload = `${orderId}|${sku}|${serial}|${issuedAt}`;
    const hash = generateWarrantyHash(rawPayload);

    const { data, error } = await supabase.from('digital_warranties').insert([{
        order_id: orderId,
        sku,
        imei_serial: serial,
        issued_at: issuedAt,
        expiry_at: expiryAt,
        certificate_hash: hash,
        is_active: true
    }]).select().single();

    if (error) {
        console.error("Warranty Ledger Write Failure:", error);
        return null;
    }

    return data;
}

export function verifyWarrantyIntegrity(certificate: any): boolean {
    const rawPayload = `${certificate.order_id}|${certificate.sku}|${certificate.imei_serial}|${certificate.issued_at}`;
    const calculatedHash = generateWarrantyHash(rawPayload);
    return calculatedHash === certificate.certificate_hash;
}
