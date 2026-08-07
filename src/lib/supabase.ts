// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Handle recovery tokens manually on /auth/callback so layout doesn't consume the hash first.
    detectSessionInUrl: false,
    persistSession: true,
    flowType: "implicit",
  },
});