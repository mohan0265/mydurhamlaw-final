// Stub for internal pre-submission originality guidance (not a detector evasion).
// Accepts text, returns guidance to reduce overlap via better quoting, synthesis, and citation.
export type OriginalityAdvice = {
  estimated_overlap?: number;     // optional
  guidance: string[];             // human-friendly steps to improve originality
  risky_segments?: Array<{ start: number; end: number; reason: string }>;
};

export async function adviseOriginality(text: string): Promise<OriginalityAdvice> {
  // TODO: Plug to your internal checker or heuristic highlighter.
  // Return guidance that encourages quotation + citation, synthesis, and rewriting in the student's own voice.
  
  // Basic heuristics for now
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Simple checks for potential issues
  const guidance: string[] = [];
  const riskySegments: Array<{ start: number; end: number; reason: string }> = [];
  
  // Check for common AI-generated patterns
  const aiPhrases = [
    'it is important to note that',
    'it should be noted that',
    'in conclusion, it can be said',
    'furthermore, it is evident',
    'moreover, one must consider'
  ];
  
  let hasAiPhrases = false;
  aiPhrases.forEach(phrase => {
    const index = text.toLowerCase().indexOf(phrase);
    if (index !== -1) {
      hasAiPhrases = true;
      riskySegments.push({
        start: index,
        end: index + phrase.length,
        reason: 'Generic AI phrasing detected'
      });
    }
  });
  
  // Generate guidance based on analysis
  if (hasAiPhrases) {
    guidance.push('Replace generic AI phrasing with your lived understanding and module terminology.');
  }
  
  if (sentences.length < wordCount / 25) {
    guidance.push('Break up long sentences and add your own analytical transitions.');
  }
  
  // Always include these core suggestions
  guidance.push('Add your own analysis contrasting at least two sources.');
  guidance.push('Where wording tracks a source, use quotation marks and an OSCOLA footnote.');
  guidance.push('Summarize, then critique: add "why this matters in this problem fact pattern."');
  
  // Check for lack of citations (basic heuristic)
  const hasCitations = /\[\d+\]|\(\d{4}\)|footnote|supra|ibid/i.test(text);
  if (!hasCitations && wordCount > 100) {
    guidance.push('Add OSCOLA citations for any referenced cases, statutes, or academic sources.');
  }
  
  return {
    estimated_overlap: hasAiPhrases ? 25 : 10, // Basic estimate
    guidance,
    risky_segments: riskySegments
  };
}