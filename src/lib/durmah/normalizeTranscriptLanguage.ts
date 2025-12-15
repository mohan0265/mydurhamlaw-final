const ASCII_LETTERS = /[A-Za-z]/g;

function isLikelyNonEnglish(text: string): boolean {
  if (!text) return false;
  const letters = text.match(ASCII_LETTERS)?.length || 0;
  return letters / Math.max(text.length, 1) < 0.4;
}

export async function normalizeTranscriptLanguage(text: string): Promise<string> {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  if (!isLikelyNonEnglish(trimmed)) return trimmed;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return trimmed;

  try {
    const prompt = `Translate this to natural English suitable for a Durham law student: ${trimmed}`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATE_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You translate text to English only. Keep it concise and natural.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!resp.ok) return trimmed;
    const json = await resp.json();
    const candidate = json?.choices?.[0]?.message?.content;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

export function normalizeTranscriptLanguageSync(text: string): string {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  if (!isLikelyNonEnglish(trimmed)) return trimmed;
  return trimmed;
}
