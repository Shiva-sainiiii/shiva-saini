"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import CollectionEditor, { type Field } from "@/components/admin/CollectionEditor";

// Naya tab / field chahiye? Bas yahan ek entry add karo (table Supabase me bana ho).
const TABS: Record<string, { fields: Field[]; readOnly?: boolean }> = {
  projects: { fields: [
    { key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" },
    { key: "tech", label: "Tech (comma separated)" }, { key: "image", label: "Cover image", type: "image" },
    { key: "live_url", label: "Live URL" }, { key: "code_url", label: "Code URL" },
  ] },
  skills: { fields: [{ key: "name", label: "Skill" }] },
  certificates: { fields: [
    { key: "title", label: "Title" }, { key: "issuer", label: "Issuer" },
    { key: "image", label: "Certificate image", type: "image" }, { key: "link", label: "Verify link" },
  ] },
  links: { fields: [{ key: "label", label: "Label (e.g. GitHub)" }, { key: "url", label: "URL" }] },
  messages: { fields: [{ key: "name", label: "Name" }], readOnly: true },
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("projects");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const shell = "mx-auto min-h-screen max-w-3xl px-6 py-12 text-white";
  if (!supabase) return <div className={shell}>Supabase env vars set nahi hain (.env.local dekho).</div>;
  if (!ready) return null;

  if (!session)
    return (
      <form className={`${shell} space-y-4`} onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const { error } = await supabase!.auth.signInWithPassword({ email: String(f.get("email")).trim(), password: String(f.get("password")) });
        setErr(error?.message ?? "");
      }}>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <input className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" name="email" type="email" required autoComplete="username" placeholder="Email" />
        <input className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" name="password" type="password" required autoComplete="current-password" placeholder="Password" />
        <button className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black">Sign in</button>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </form>
    );

  return (
    <div className={shell}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <button onClick={() => supabase!.auth.signOut()} className="text-sm text-white/50 hover:text-white">Sign out</button>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.keys(TABS).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${tab === t ? "bg-white text-black" : "border border-white/15 text-white/70"}`}>{t}</button>
        ))}
      </div>
      <CollectionEditor key={tab} table={tab} fields={TABS[tab].fields} readOnly={TABS[tab].readOnly} />
    </div>
  );
}
