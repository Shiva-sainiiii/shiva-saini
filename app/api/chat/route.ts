import { NextResponse } from "next/server";
import { askGemini, geminiModels, GeminiError, hasGeminiKey, type ChatMsg } from "@/lib/server/gemini";
import { buildSystemPrompt, loadChatContext } from "@/lib/server/chat-context";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireAdmin } from "@/lib/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // env har request pe padhna hai (build time pe freeze nahi)
export const maxDuration = 45;

// Status: site isse check karti hai ki chat section dikhana hai ya nahi. Key kabhi return nahi hoti.
export async function GET() {
  return NextResponse.json({ configured: hasGeminiKey(), models: geminiModels() });
}

export async function POST(req: Request) {
  // Admin token bhejta hai to error ki asli wajah (detail) milti hai; visitors ko sirf friendly message.
  const isAdmin = req.headers.get("authorization") ? (await requireAdmin(req)).ok : false;
  const fail = (status: number, error: string, detail?: string) =>
    NextResponse.json({ error, ...(isAdmin && detail ? { detail } : {}) }, { status });

  if (!hasGeminiKey()) return fail(503, "The assistant isn't set up yet.", "GEMINI_API_KEY Vercel env me nahi mila. Add karke Redeploy karo.");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!isAdmin && (!rateLimit(`m:${ip}`, 8, 60_000) || !rateLimit(`h:${ip}`, 60, 3_600_000)))
    return fail(429, "You're sending messages too fast — please wait a minute.");

  let body: unknown;
  try { body = await req.json(); } catch { return fail(400, "Bad request."); }
  const raw = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(raw)) return fail(400, "Bad request.");

  // Sirf last 10 messages, har ek max 1000 chars — cost aur abuse dono kam
  const messages: ChatMsg[] = raw.slice(-10).flatMap((m): ChatMsg[] => {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return [];
    return [{ role, content: content.trim().slice(0, 1000) }];
  });
  while (messages.length && messages[0].role !== "user") messages.shift(); // Gemini history user se shuru honi chahiye
  if (!messages.length || messages[messages.length - 1].role !== "user") return fail(400, "Bad request.");

  try {
    const ctx = await loadChatContext();
    if (ctx.settings.chatbot_enabled === "false" && !isAdmin) return fail(403, "The assistant is switched off right now.");

    const reply = await askGemini(buildSystemPrompt(ctx), messages);
    // Prompt me plain text maanga hai, phir bhi kabhi-kabhi markdown aa jaata hai — saaf kar do
    const clean = reply.replace(/\*\*/g, "").replace(/^\s*\*\s+/gm, "- ").replace(/^#{1,6}\s+/gm, "");
    return NextResponse.json({ reply: clean });
  } catch (e) {
    const err = e instanceof GeminiError ? e : new GeminiError("failed", (e as Error).message);
    if (err.kind === "busy") return fail(429, "The assistant is busy right now (free quota). Please try again in a bit.", err.message);
    if (err.kind === "blocked") return fail(422, "I can't answer that one — try asking something else!", err.message);
    return fail(502, "The assistant couldn't reply right now. Please try again in a bit.", err.message);
  }
}
