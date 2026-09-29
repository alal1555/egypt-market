// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseProjectUrl } from '@/lib/supabase-url';

const supabaseUrl = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the Project URL (https://xxx.supabase.co), not /rest/v1.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Handle recovery tokens manually on /auth/callback so layout doesn't consume the hash first.
    detectSessionInUrl: false,
    persistSession: true,
    flowType: "implicit",
  },
});