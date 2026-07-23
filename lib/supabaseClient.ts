import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim().length > 0 &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl.trim()) &&
  typeof supabaseKey === 'string' &&
  supabaseKey.trim().length > 0;

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl.trim(), supabaseKey.trim())
  : null;

export default supabase;
