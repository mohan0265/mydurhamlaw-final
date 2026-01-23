import { DurmahContextPacket } from '@/types/durmah';

export interface QuizPrompt {
  question: string;
  context_used: string[];
  grounding_score: number;
}

export interface QuizFeedback {
  is_correct: boolean;
  score: number; // 1-5
  feedback: string;
  suggested_reading?: string;
  provenance: string[];
}

export class QuizGuard {
  /**
   * Evaluates if there is enough context to generate a high-quality, grounded quiz question.
   * Returns a refusal message if context is insufficient.
   */
  static evaluateContext(context: DurmahContextPacket): {
    can_quiz: boolean;
    reason?: string;
    source_type?: 'module' | 'lecture' | 'assignment';
  } {
    // 1. Check for Lecture Context
    if (context.lectures?.current?.transcript_snippet || context.lectures?.current?.summary) {
      return { can_quiz: true, source_type: 'lecture' };
    }

    // 2. Check for Assignment Context
    if (context.modeContext?.assignmentId) {
       return { can_quiz: true, source_type: 'assignment' };
    }

    // 3. Check for Module Content in Durham DB (This will be fetched via tool in actual implementation)
    // For now, if no specifically active lecture or assignment, we need to ensure some grounding exists
    
    return {
      can_quiz: false,
      reason: "I don't have enough specific lecture notes or assignment briefs to quiz you effectively yet. Please upload a lecture transcript or select an active assignment so I can provide grounded practice."
    };
  }

  /**
   * Wraps the LLM prompt with strict grounding instructions.
   */
  static wrapSystemPrompt(basePrompt: string, sourceType: string): string {
    return `
${basePrompt}

CRITICAL GUARDRAIL: YOU ARE IN "QUIZ ME" MODE.
Your goal is to test the student's understanding of the provided ${sourceType} context.

1. NEVER invent Durham-specific facts or module requirements.
2. ONLY ask questions that can be answered using the provided context snippets.
3. If the context is insufficient to answer a student's follow-up, say: "My records for this ${sourceType} don't contain that specific detail. Based on general legal principles, however..."
4. Keep feedback "Professor-style": rigorous, structured (e.g., using IRAC), and encouraging.
5. Every response MUST include a 'Provenance' section listing the source materials used.
    `;
  }

  /**
   * Formats provenance for the UI.
   */
  static formatProvenance(sources: Array<{ type: string; title: string }>): string {
    if (!sources || sources.length === 0) return '';
    return `\n\n**Sources:**\n${sources.map(s => `- ${s.title} (${s.type})`).join('\n')}`;
  }
}
