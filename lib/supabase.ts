import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Prefer Vite-style env vars in the browser
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

if (url && anon) {
  try {
    supabase = createClient(url, anon, {
      auth: {
        persistSession: true
      }
    });
    console.log('Supabase client initialized successfully');
  } catch (e) {
    console.error('Erro ao criar cliente Supabase:', e);
    supabase = null;
  }
} else {
  console.warn('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  console.warn('URL:', url ? 'Set' : 'Not set');
  console.warn('ANON_KEY:', anon ? 'Set' : 'Not set');
}

export { supabase };
