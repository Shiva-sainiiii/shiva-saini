import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { getAdminDb } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Feedback delete: Firestore rules public delete allow nahi karte (aur karne bhi nahi chahiye).
// Isliye admin ka Supabase token server pe verify karke Firebase Admin SDK se delete karte hain (rules bypass hote hain).
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = ((await req.json().catch(() => ({}))) ?? {}) as { id?: unknown };
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  try {
    await getAdminDb().collection("feedback").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback delete]", e);
    return NextResponse.json({ error: (e as Error).message || "Delete failed." }, { status: 500 });
  }
}
