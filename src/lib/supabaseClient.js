/**
 * Browser-side Supabase client.
 *
 * SAFE TO EXPOSE: this uses only the PUBLIC anon key.
 *
 * The anon key is designed to be public, BUT this is only safe when every
 * Supabase table has Row Level Security (RLS) turned on with explicit policies.
 * See supabase/schema.sql for our RLS setup.
 *
 * NEVER import the service-role key here. The service-role key lives only in
 * netlify/functions/_shared/supabaseAdmin.js.
 */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Don't throw — the skeleton should still load in the browser even before
  // env vars are filled in. Just log a friendly warning.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. " +
      "Frontend Supabase features will be disabled. Add them to .env and restart.",
  );
}

export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = Boolean(url && anonKey);
