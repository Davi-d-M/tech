import { supabase } from './supabaseClient';

export interface Coupon {
  id: number;
  code: string;
  discount_percent: number;
  is_active: boolean;
}

/**
 * Validates a coupon code against Supabase
 */
export async function validateCoupon(code: string): Promise<Coupon | null> {
  if (!supabase || !code.trim()) return null;

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as Coupon;
  } catch (err) {
    console.error("Coupon Validation Error:", err);
    return null;
  }
}

/**
 * Calculates the discounted amount
 */
export function calculateDiscount(total: number, percent: number): number {
  return (total * percent) / 100;
}
