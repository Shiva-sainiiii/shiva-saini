import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/data";

// Admin = SITE.email (wahi email jo supabase/schema.sql ke is_admin() me hai). Badalna ho to dono jagah badlo.
export const ADMIN_EMAIL = SITE.email.toLowerCase();

type Check = { ok: true; email: string } | { ok: false; status: number; error: string };

/**
 * API routes ke liye: request ke `Authorization: Bearer <supabase access token>` ko Supabase se verify karta hai
 * aur sirf admin email ko allow karta hai. (Client ka bheja hua email kabhi trust nahi karte — token server pe verify hota hai.)
 */
export async function requireAdmin(req: Request): Promise<Check> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, status: 500, error: "Supabase env vars server pe set nahi hain." };

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, status: 401, error: "Login required." };

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: "Session invalid ya expire ho gayi. Dobara login karo." };
  if (email !== ADMIN_EMAIL) return { ok: false, status: 403, error: "Sirf admin ye kar sakta hai." };
  return { ok: true, email };
}
