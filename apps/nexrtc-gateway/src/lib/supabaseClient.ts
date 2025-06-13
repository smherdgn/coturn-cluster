// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined.");
}
if (!supabaseServiceRoleKey && !anonKey) {
  throw new Error("Neither SUPABASE_SERVICE_ROLE_KEY nor ANON_KEY is defined.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || anonKey || ""
);
