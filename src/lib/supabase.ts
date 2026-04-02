/**
 * Supabase Client — Frontend (Browser-safe)
 * 
 * Uses the ANON key for client-side operations.
 * All database access is governed by Row Level Security (RLS) policies.
 * Returns null when env vars are missing (e.g., during Vercel build).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;
