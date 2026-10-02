"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, SITE } from "@/lib/data";
import CollectionEditor, { type Field } from "@/components/admin/CollectionEditor";
import FeedbackManager from "@/components/admin/FeedbackManager";
import ChatbotSettings from "@/components/admin/ChatbotSettings";

// Naya tab / field chahiye? Bas yahan ek entry add karo (table Supabase me bana ho).
const TABS: Record<string, { fields: Field[]; subtitle?: string[]; readOnly?: boolean }> = {
  projects: {
    subtitle: ["category", "tech"],
    fields: [
      { key: "title", label: "Project name" },
      { key: "description", label: "Short description", type: "textarea" },
      { key: "image", label: "Cover image", type: "image" },
      { key: "tech", label: "Skills used (comma separated)", placeholder: "Next.js, Firebase, Tailwind" },
      { key: "category", label: "Tag", type: "select", options: CATEGORIES },
      { key: "live_url", label: "Live URL (optional)" },
      { key: "code_url", label: "Code URL (optional)" },
    ],
  },
  skills: { fields: [{ key: "name", label: "Skill" }] },
  certificates: {
    subtitle: ["issuer"],
    fields: [
      { key: "title", label: "Certificate name" },
      { key: "image", label: "Certificate photo", type: "image" },
      { key: "issuer", label: "Issued by (optional)" },
      { key: "link", label: "Verify link (optional)" },
    ],
  },
  links: { fields: [{ key: "label", label: "Label (e.g. GitHub)" }, { key: "url", label: "URL" }] },
  messages: { fields: [{ key: "name", label: "Name" }], readOnly: true },
};
const EXTRA = ["feedback", "chatbot"]; // custom panels
const ALL_TABS = [...Object.keys(TABS), ...EXTRA];

const ADMIN_EMAIL = SITE.email.toLowerCase();
const fieldCls = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("projects");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const shell = "mx-auto min-h-screen max-w-3xl px-6 py-12 text-white";
  if (!supabase) return <div className={shell}>Supabase env vars set nahi hain (.env.local / Vercel env dekho).</div>;
  if (!ready) return null;

  if (!session)
    return (
      <form className={`${shell} max-w-md space-y-4`} onSubmit={async (e) => {
        e.preventDefault();
        setSigning(true); setErr("");
        const { error } = await supabase!.auth.signInWithPassword(login);
        setSigning(false);
        if (error) setErr(error.message);
      }}>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <input className={fieldCls} type="email" required autoComplete="username" placeholder="Email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
        <input className={fieldCls} type="password" required autoComplete="current-password" placeholder="Password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
        <button disabled={signing} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-50">{signing ? "Signing in…" : "Sign in"}</button>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <a href="/" className="block text-sm text-white/40 hover:text-white">← Back to site</a>
      </form>
    );

  // Koi aur Supabase user ban bhi gaya ho to edit nahi kar payega (RLS), par saaf message dikhate hain
  if (session.user.email?.toLowerCase() !== ADMIN_EMAIL)
    return (
      <div className={`${shell} space-y-4`}>
        <p>Ye account ({session.user.email}) admin nahi hai.</p>
        <button onClick={() => supabase!.auth.signOut()} className="text-sm text-white/60 underline">Sign out</button>
      </div>
    );

  return (
    <div className={shell}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-5 text-sm text-white/50">
          <a href="/" target="_blank" rel="noreferrer" className="hover:text-white">View site ↗</a>
          <button onClick={() => supabase!.auth.signOut()} className="hover:text-white">Sign out</button>
        </div>
      </div>
      <div className="-mx-6 mb-6 flex gap-2 overflow-x-auto px-6 pb-1">
        {ALL_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm capitalize ${tab === t ? "bg-white text-black" : "border border-white/15 text-white/70"}`}>{t}</button>
        ))}
      </div>
      {tab === "feedback" ? <FeedbackManager /> : tab === "chatbot" ? <ChatbotSettings /> : (
        <CollectionEditor key={tab} table={tab} fields={TABS[tab].fields} subtitle={TABS[tab].subtitle} readOnly={TABS[tab].readOnly} />
      )}
    </div>
  );
}
