import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Supabase Env Vars Missing in Client!");
    console.log("URL:", supabaseUrl ? "Set" : "Missing");
    console.log("Key:", supabaseKey ? "Set" : "Missing");
}

export const supabase = createClientComponentClient({
    supabaseUrl,
    supabaseKey,
});
