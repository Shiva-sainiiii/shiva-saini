"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { SITE } from "@/lib/data";
import type { LinkItem } from "@/lib/content";

const input = "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/50";

export default function Contact({ links }: { links: LinkItem[] }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Supabase na ho to mail app khul jaayegi
    if (!supabase) { window.location.href = `mailto:${SITE.email}?body=${encodeURIComponent(form.message)}`; return; }
    setStatus("sending");
    const { error } = await supabase.from("messages").insert(form);
    if (error) return setStatus("error");
    setForm({ name: "", email: "", message: "" }); setStatus("done");
  };

  return (
    <div>
      <a href={`mailto:${SITE.email}`} className="break-all text-2xl font-semibold underline-offset-8 hover:underline md:text-5xl">{SITE.email}</a>
      <p className="mt-4 text-white/40">{SITE.location}</p>

      <form onSubmit={submit} className="mt-12 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input className={input} placeholder="Name" required value={form.name} onChange={set("name")} />
          <input className={input} type="email" placeholder="Email" required value={form.email} onChange={set("email")} />
        </div>
        <textarea className={input} placeholder="Message" rows={4} required maxLength={2000} value={form.message} onChange={set("message")} />
        <button disabled={status === "sending"} className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black disabled:opacity-50">
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "done" && <p className="text-sm text-white/60">Message sent. I will get back to you soon.</p>}
        {status === "error" && <p className="text-sm text-red-400">Could not send. Please email me directly.</p>}
      </form>

      <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-white/50">
        {links.map((l) => (
          <li key={l.id}><a href={l.url} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">{l.label}</a></li>
        ))}
      </ul>
    </div>
  );
}
