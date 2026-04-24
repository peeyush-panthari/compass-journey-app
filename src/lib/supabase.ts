import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "[Supabase] Missing environment variables. " +
        "Please create a .env.local file in your project root with:\n" +
        "  VITE_SUPABASE_URL=https://krgouvtjrnocpdswsjnq.supabase.co\n" +
        "  VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-dashboard>"
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});