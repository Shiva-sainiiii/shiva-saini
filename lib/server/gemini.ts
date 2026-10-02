// Google AI Studio (Gemini API) — seedha REST, koi SDK nahi. Key sirf server pe (Vercel env: GEMINI_API_KEY).
const API = "https://generativelanguage.googleapis.com/v1beta/models";

// Free tier me sirf Flash / Flash-Lite models hain. Model naam Google badalta rehta hai,
// isliye Vercel env me GEMINI_MODEL (comma separated) se override kar sakte ho — code badalne ki zaroorat nahi.
const DEFAULT_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];

export const geminiModels = (): string[] => {
  const list = process.env.GEMINI_MODEL?.split(",").map((s) => s.trim()).filter(Boolean);
  return list?.length ? list : DEFAULT_MODELS;
};
export const hasGeminiKey = () => Boolean(process.env.GEMINI_API_KEY?.trim());

export type ChatMsg = { role: "user" | "assistant"; content: string };
export type GeminiErrorKind = "busy" | "blocked" | "failed";
export class GeminiError extends Error {
  constructor(public kind: GeminiErrorKind, message: string) { super(message); }
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

/**
 * Pehle model se try; 429 (free quota/min), 404 (model hata diya gaya), 5xx ya timeout par agla model try hota hai.
 * 400/401/403 (galat key / galat request) aur safety-block par turant ruk jaata hai — baaki models bhi fail hi honge.
 */
export async function askGemini(system: string, messages: ChatMsg[]): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new GeminiError("failed", "GEMINI_API_KEY missing");

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
  });

  let last = new GeminiError("failed", "No model tried");
  for (const model of geminiModels().slice(0, 3)) {
    let res: Response;
    try {
      res = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
    } catch (e) {
      console.error(`[chat] ${model} request failed`, e);
      last = new GeminiError("failed", `${model}: ${(e as Error).name === "TimeoutError" ? "timeout" : "network error"}`);
      continue;
    }

    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[chat] ${model} -> HTTP ${res.status}: ${text}`);
      const msg = `${model}: HTTP ${res.status} ${text}`;
      if (res.status === 429) { last = new GeminiError("busy", msg); continue; }
      if (res.status === 404 || res.status >= 500) { last = new GeminiError("failed", msg); continue; }
      throw new GeminiError("failed", msg); // 400 / 401 / 403 ...
    }

    const data = (await res.json().catch(() => null)) as GeminiResponse | null;
    const cand = data?.candidates?.[0];
    const reply = cand?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (reply) return reply;

    if (data?.promptFeedback?.blockReason || cand?.finishReason === "SAFETY")
      throw new GeminiError("blocked", `${model}: blocked (${data?.promptFeedback?.blockReason ?? cand?.finishReason})`);
    last = new GeminiError("failed", `${model}: empty reply (finishReason ${cand?.finishReason ?? "none"})`);
  }
  throw last;
}
