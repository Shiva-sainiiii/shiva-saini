import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Env set nahi hai to null — site static data (lib/data.ts) pe chalti rahegi
export const supabase = url && key ? createClient(url, key) : null;
