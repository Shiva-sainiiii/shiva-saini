import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { EXPERIENCE, SITE } from "@/lib/data";

type Msg = { role: "user" | "assistant"; content: string };

// System prompt: static info + Supabase se live projects/skills (admin se update karoge to AI bhi jaan jaayega)
async function systemPrompt() {
  let projects = "", skills = "";
  if (supabase) {
    const [p, s] = await Promise.all([
      supabase.from("projects").select("title,description,tech").order("position"),
      supabase.from("skills").select("name").order("position"),
    ]);
    projects = (p.data ?? []).map((x) => `- ${x.title}: ${x.description} (${x.tech})`).join("\n");
    skills = (s.data ?? []).map((x) => x.name).join(", ");
  }
  return `You are the AI assistant on ${SITE.name}'s portfolio website. Answer visitors' questions about Shiva clearly and briefly; you may also help with general coding questions.
Only state facts about Shiva from the info below. If something is not covered, say so and suggest emailing ${SITE.email}.
About: ${SITE.about}
Role: ${SITE.role}. Location: ${SITE.location}. Available for opportunities.
Experience: ${EXPERIENCE.map((e) => `${e.company} (${e.role}, ${e.period})`).join("; ")}
Skills: ${skills}
Projects:\n${projects}`;
}

async function gemini(sys: string, msgs: Msg[]) {
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: msgs.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `Gemini error ${r.status}`);
  return (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
}

async function openrouter(sys: string, msgs: Msg[]) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "system", content: sys }, ...msgs],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `OpenRouter error ${r.status}`);
  return j.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: Msg[] };
    if (!Array.isArray(messages) || !messages.length) return NextResponse.json({ error: "No message" }, { status: 400 });
    const clean: Msg[] = messages.slice(-10).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) }));
    const sys = await systemPrompt();

    let reply: string;
    if (process.env.GEMINI_API_KEY) reply = await gemini(sys, clean);
    else if (process.env.OPENROUTER_API_KEY) reply = await openrouter(sys, clean);
    else return NextResponse.json({ error: "AI not configured: set GEMINI_API_KEY (or OPENROUTER_API_KEY) in Vercel env vars and redeploy." }, { status: 500 });

    return NextResponse.json({ reply: reply || "The model returned an empty reply. Try again." });
  } catch (e) {
    // Asli error UI tak bhejte hain, taaki debug karna aasaan ho
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 500 });
  }
}
