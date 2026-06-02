/**
 * Centralised Supabase configuration check.
 * Lovable Cloud auto-provisions credentials, so this is always true.
 */
export const IS_SUPABASE_CONFIGURED = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)
);
