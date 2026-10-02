"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
const SUGGESTIONS = ["What projects have you built?", "Which skills do you know?", "How can I contact you?"];
const DEFAULT_GREETING = "Hi! I'm Shiva's AI assistant. Ask me about his projects, skills or experience.";

// Chat backend: /api/chat (Gemini, key server pe). Greeting sirf UI me hai — API ko bheji nahi jaati.
export default function Chat({ greeting, name }: { greeting?: string; name?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);

  // Page ko nahi, sirf chat box ko scroll karo
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  const send = async (raw: string) => {
    const content = raw.trim().slice(0, 1000);
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next); setText(""); setError(""); setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const j = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (res.ok && j.reply) setMsgs([...next, { role: "assistant", content: j.reply }]);
      else setError(j.error || "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div>
      <div ref={box} className="h-[26rem] space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-6" aria-live="polite">
        <Bubble role="assistant" label={name}>{greeting || DEFAULT_GREETING}</Bubble>
        {msgs.map((m, i) => <Bubble key={i} role={m.role} label={m.role === "assistant" ? name : undefined}>{m.content}</Bubble>)}
        {busy && <p className="text-sm text-white/40">Thinking…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {msgs.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy} className="rounded-full border border-white/15 px-4 py-1.5 text-white/60 transition-colors hover:text-white disabled:opacity-40">{s}</button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); void send(text); }} className="mt-4 flex gap-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Ask anything about Shiva…" aria-label="Your message"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 outline-none focus:border-white/50" />
        <button disabled={busy || !text.trim()} className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black disabled:opacity-40">Send</button>
      </form>
      <p className="mt-3 text-xs text-white/30">AI can make mistakes. Messages are processed by Google Gemini.</p>
    </div>
  );
}

function Bubble({ role, label, children }: { role: Msg["role"]; label?: string; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${mine ? "bg-white text-black" : "border border-white/10 text-white/80"}`}>
        {!mine && label && <span className="mb-1 block text-xs text-white/40">{label}</span>}
        {children}
      </div>
    </div>
  );
}
