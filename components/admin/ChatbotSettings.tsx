"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const input = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/50";
const KEYS = ["chatbot_enabled", "chatbot_name", "chatbot_greeting", "chatbot_prompt"] as const;
type Form = Record<(typeof KEYS)[number], string>;
type Status = { configured: boolean; models: string[] } | null;

// Gemini key yahan nahi daalte — wo Vercel env (GEMINI_API_KEY) me rehti hai. Yahan sirf bot ki personality / on-off hai.
export default function ChatbotSettings() {
  const [form, setForm] = useState<Form>({ chatbot_enabled: "true", chatbot_name: "", chatbot_greeting: "", chatbot_prompt: "" });
  const [status, setStatus] = useState<Status>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState("");

  useEffect(() => {
    supabase!.from("settings").select("key,value").then(({ data, error }) => {
      if (error) return setMsg(`${error.message} — supabase/migration-002-admin.sql run kiya?`);
      const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? ""]));
      setForm((f) => ({ ...f, ...Object.fromEntries(KEYS.filter((k) => k in map).map((k) => [k, map[k]])) }));
    });
    fetch("/api/chat").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, []);

  const save = async () => {
    setBusy(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase!.from("settings").upsert(KEYS.map((key) => ({ key, value: form[key], updated_at: now }))).select("key");
    setBusy(false);
    setMsg(error ? error.message : data?.length ? "Saved ✓ (bot ~1 minute me naya data utha leta hai)" : "Save nahi hua — admin email se login ho?");
  };

  const runTest = async () => {
    setBusy(true); setTest("Thinking…");
    try {
      const token = (await supabase!.auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ messages: [{ role: "user", content: "Who is Shiva? Answer in one sentence." }] }),
      });
      const j = (await res.json()) as { reply?: string; error?: string; detail?: string };
      setTest(res.ok ? `✓ ${j.reply}` : `✗ ${j.error}${j.detail ? `\n${j.detail}` : ""}`);
    } catch {
      setTest("✗ Network error");
    }
    setBusy(false);
  };

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 p-4 text-sm">
        <p className="font-medium">Server status</p>
        {status === null ? (
          <p className="mt-2 text-white/50">Checking…</p>
        ) : status.configured ? (
          <p className="mt-2 text-emerald-400">✓ GEMINI_API_KEY mil gayi. Models (order me): {status.models.join(" → ")}</p>
        ) : (
          <p className="mt-2 text-amber-400">
            GEMINI_API_KEY Vercel env me nahi mili. aistudio.google.com/apikey se key banao → Vercel → Settings → Environment Variables me <code>GEMINI_API_KEY</code> add karo → Redeploy.
            Jab tak key nahi, site pe chat section hide rahega.
          </p>
        )}
        <button onClick={runTest} disabled={busy || !status?.configured} className="mt-3 rounded-full border border-white/20 px-4 py-1.5 text-xs disabled:opacity-40">Send test message</button>
        {test && <p className="mt-3 whitespace-pre-wrap break-words text-white/70">{test}</p>}
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 p-4">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={form.chatbot_enabled !== "false"} onChange={(e) => setForm({ ...form, chatbot_enabled: e.target.checked ? "true" : "false" })} />
          Chatbot section site pe dikhao
        </label>
        <label className="block text-xs text-white/50">Bot name
          <input className={`${input} mt-1`} placeholder="Shiva's AI" maxLength={40} value={form.chatbot_name} onChange={set("chatbot_name")} />
        </label>
        <label className="block text-xs text-white/50">Greeting (pehla message)
          <input className={`${input} mt-1`} placeholder="Hi! I'm Shiva's AI assistant. Ask me about his projects, skills or experience." maxLength={200} value={form.chatbot_greeting} onChange={set("chatbot_greeting")} />
        </label>
        <label className="block text-xs text-white/50">Extra info about you (bot isse jawab dega)
          <textarea className={`${input} mt-1`} rows={6} maxLength={3000} placeholder="e.g. Open to freelance + internships. Available from Jan. Expected stack: Next.js, Firebase…" value={form.chatbot_prompt} onChange={set("chatbot_prompt")} />
        </label>
        <p className="text-xs text-white/30">Note: ye settings public table me save hoti hain — password / private cheez mat likhna. Projects, skills, certificates bot ko apne aap mil jaate hain.</p>
        <button onClick={save} disabled={busy} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-50">Save</button>
      </div>
      {msg && <p className="text-sm text-white/60">{msg}</p>}
    </div>
  );
}
