const { supabaseAdmin } = require("./_lib/supabase");
const OpenAI = require("openai");

const openaiKey = process.env.OPENAI_API_KEY;
const client = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

async function fetchRecentMessages(ticket_id) {
  const { data } = await supabaseAdmin
    .from("support_messages")
    .select("role, content, created_at")
    .eq("ticket_id", ticket_id)
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

async function fetchKbHints(tags = []) {
  const { data } = await supabaseAdmin
    .from("support_kb_articles")
    .select("title, body, tags")
    .eq("is_published", true)
    .limit(5);
  return data || [];
}

exports.handler = async (event) => {
  if (!client) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ai_not_configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid_json" }) };
  }

  const { ticket_id, latest_user_message, user_profile } = body;
  if (!ticket_id || !latest_user_message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "missing_fields" }),
    };
  }

  // Gather context
  const recent = await fetchRecentMessages(ticket_id);
  const kb = await fetchKbHints();

  const systemPrompt = `
You are Caseway Support. 
- Be concise, warm, and helpful.
- Never ask for passwords or secrets.
- Offer step-by-step troubleshooting.
- If you are unsure or confidence is low, say you'll escalate and set status to pending.
- Do not expose internal details or environment variables.
User profile (may be empty): ${JSON.stringify(user_profile || {})}
Relevant KB (summaries):
${kb.map((k) => `- ${k.title}: ${k.body.slice(0, 200)}...`).join("\n")}
`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...recent
      .reverse()
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    { role: "user", content: latest_user_message },
  ];

  let aiText =
    "Thanks for the details. I will escalate this for a human to review.";
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 400,
    });
    aiText = completion.choices?.[0]?.message?.content || aiText;
  } catch (err) {
    console.warn("[support-ai-reply] OpenAI error", err?.message || err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, reply: aiText }),
  };
};
