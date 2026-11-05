import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigError: string | null =
  !url || !anonKey
    ? "Die Supabase-Konfiguration fehlt. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local oder in den Vercel-Umgebungsvariablen eintragen."
    : null;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
