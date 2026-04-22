// src/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables (URL or Key)");
  }

  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: { persistSession: false }, // server mode
    }
  );
}
