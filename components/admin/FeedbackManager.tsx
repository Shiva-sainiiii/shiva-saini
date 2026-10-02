"use client";
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

type Review = { id: string; name: string; stars: number; message: string; createdAt?: { toDate?: () => Date } | null };

// Feedback list Firestore se realtime aati hai (rules me read public hai).
// Delete server route se hota hai (/api/admin/feedback) — wahan admin token verify hota hai.
export default function FeedbackManager() {
  const [items, setItems] = useState<Review[]>([]);
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(200));
    return onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }))),
      (e) => setMsg(e.message)
    );
  }, []);

  const remove = async (r: Review) => {
    if (!confirm(`Delete feedback from "${r.name}"?`)) return;
    setDeleting(r.id); setMsg("");
    try {
      const token = (await supabase!.auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/admin/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ id: r.id }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? "Deleted ✓" : j.error || "Delete failed.");
    } catch {
      setMsg("Network error — dobara try karo.");
    }
    setDeleting(null);
  };

  if (!db) return <p className="text-sm text-white/60">Firebase env vars set nahi hain, isliye feedback available nahi.</p>;

  return (
    <div>
      {msg && <p className="mb-4 text-sm text-white/60">{msg}</p>}
      {items.length === 0 && <p className="text-sm text-white/40">Abhi koi feedback nahi.</p>}
      <ul className="divide-y divide-white/10">
        {items.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-4 py-4 text-sm">
            <div className="min-w-0">
              <p>{"★".repeat(r.stars)}<span className="text-white/20">{"★".repeat(Math.max(0, 5 - r.stars))}</span></p>
              <p className="mt-1 whitespace-pre-wrap break-words text-white/80">{r.message}</p>
              <p className="mt-1 text-xs text-white/40">{r.name}{r.createdAt?.toDate ? ` · ${r.createdAt.toDate().toLocaleString()}` : ""}</p>
            </div>
            <button onClick={() => remove(r)} disabled={deleting === r.id} className="shrink-0 text-white/50 hover:text-red-400 disabled:opacity-40">
              {deleting === r.id ? "Deleting…" : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
