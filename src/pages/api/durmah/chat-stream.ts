// src/pages/api/durmah/chat-stream.ts
import { DURMAH_SYSTEM_PROMPT } from "@/lib/durmahPrompt";

export const config = {
  runtime: "nodejs",
};

type Role = "system" | "user" | "assistant";
type InMsg = { role: Role; content: string };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { messages?: InMsg[]; pageContext?: string; model?: string, voice?: boolean };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  const model = body.model || "gpt-4o-mini";
  const isVoiceMode = body.voice || false;

  // Narrow the literal types so TS doesn't widen to `string`
  const msgs: InMsg[] = [
    { role: "system" as const, content: DURMAH_SYSTEM_PROMPT },
    ...(body.pageContext
      ? [{ role: "system" as const, content: `Page context:\n${body.pageContext}` }]
      : []),
    ...((body.messages ?? []) as InMsg[]),
  ];

  const requestBody: any = {
    model,
    messages: msgs,
    temperature: 0.3,
    stream: true,
  };

  if (isVoiceMode) {
    console.log("Voice mode detected, capping response length.");
    requestBody.max_tokens = 90; // Tweak this value to adjust length
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(`Upstream error: ${upstream.status}\n${text}`, { status: 500 });
  }

  // Pipe OpenAI SSE straight through
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(encoder.encode(decoder.decode(value, { stream: true })));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
