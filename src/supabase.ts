import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const publishable =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() || '';

if (!url || !publishable) {
  console.warn(
    '[NutriPlan] Falta VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. El login no funcionará hasta configurarlas.',
  );
}

export const supabase = createClient(url || 'http://localhost', publishable || 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishable);
}
