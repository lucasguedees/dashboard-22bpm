import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Prefer Vite-style env vars in the browser
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Hardcoded fallback for production (emergency)
const FALLBACK_URL = 'https://jqtwqttcuaegutdbavzz.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdHdxdHRjdWFlZ3V0ZGJhdnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NzE5NTEsImV4cCI6MjA4NDI0Nzk1MX0.NI92dFeqGw5uzr_OMPEOSsRV0NXw8h_0CIXiKYtQiUI';

let supabase: SupabaseClient | null = null;
let usingFallback = false;

// Use environment variables or fallback
const finalUrl = url || FALLBACK_URL;
const finalAnon = anon || FALLBACK_ANON;

if (finalUrl && finalAnon) {
  try {
    supabase = createClient(finalUrl, finalAnon, {
      auth: {
        persistSession: true
      }
    });
    usingFallback = !url || !anon;
    console.log('Supabase client initialized successfully');
    if (usingFallback) {
      console.warn('⚠️ Using fallback Supabase credentials - check environment variables');
    }
  } catch (e) {
    console.error('Erro ao criar cliente Supabase:', e);
    supabase = null;
  }
} else {
  console.error('❌ Supabase não configurado - missing URL and ANON_KEY');
}

export { supabase, usingFallback };
