import { normalizeTranscriptLanguageSync } from '@/lib/durmah/normalizeTranscriptLanguage';

describe('normalizeTranscriptLanguageSync', () => {
  it('returns English unchanged', () => {
    const input = 'This is an English sentence about contract law.';
    expect(normalizeTranscriptLanguageSync(input)).toBe(input);
  });

  it('passes through Malay (heuristic) when translation is unavailable (sync)', () => {
    const input = 'Ini adalah contoh ayat dalam Bahasa Melayu.';
    expect(normalizeTranscriptLanguageSync(input)).toBe(input);
  });
});
