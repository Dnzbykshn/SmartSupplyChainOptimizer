/**
 * Supabase Client — Frontend (Browser-safe)
 * 
 * Uses the ANON key for client-side operations.
 * All database access is governed by Row Level Security (RLS) policies.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
