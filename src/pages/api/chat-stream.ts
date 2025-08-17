// src/pages/api/chat-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT =
  "You are Durmah, a friendly, succinct voice mentor for Durham law students. " +
  "Be natural, avoid repetition, and keep answers concise unless asked for depth. " +
  "Acknowledge when audio is still connecting, but never repeat the same listening line. " +
  "If the user is just testing the mic, respond briefly and invite a question.";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body as { messages?: ChatMessage[] };
    const incoming = Array.isArray(body?.messages) ? body.messages : [];

    // Type guard: coerce/validate roles
    const sanitized: ChatMessage[] = incoming
      .filter(m => m && typeof m.content === "string")
      .map(m => {
        const role = (["system", "user", "assistant"] as const).includes(m.role as any)
          ? (m.role as "system" | "user" | "assistant")
          : "user";
        return { role, content: m.content.trim() };
      });

    // Only inject system prompt once, at the start of each session
    const hasSystem = sanitized.some(m => m.role === "system");
    const msgs: ChatMessage[] = hasSystem
      ? [...sanitized]
      : [{ role: "system", content: SYSTEM_PROMPT }, ...sanitized];

    // Basic duplicate guard: if last assistant == penultimate assistant, drop the last one
    if (msgs.length >= 2) {
      const last = msgs[msgs.length - 1];
      const prev = msgs[msgs.length - 2];
      if (last && prev && last.role === "assistant" && prev.role === "assistant" && last.content === prev.content) {
        msgs.pop();
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: msgs,
      temperature: 0.6,
      max_tokens: 400,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || "Okay.";
    res.status(200).json({ text });
  } catch (err: any) {
    console.error("[chat-stream] error", err);
    res.status(500).json({ error: "Chat failed", detail: err?.message ?? String(err) });
  }
}
