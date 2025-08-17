/**
 * Durmah Voice Guardrails - Academic Integrity Protection
 * Detects and prevents academic misconduct while providing ethical guidance
 */

export interface GuardrailsResult {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GuardrailsOptions {
  strictMode?: boolean;
  allowResearchAssistance?: boolean;
  allowConceptualExplanations?: boolean;
}

class VoiceGuardrails {
  // Patterns that indicate direct assignment writing requests
  private readonly directWritingPatterns = [
    /write my (essay|assignment|dissertation|coursework|paper)/i,
    /complete my (essay|assignment|dissertation|coursework|paper)/i,
    /do my (homework|assignment|essay|coursework)/i,
    /generate my (essay|assignment|dissertation|paper)/i,
    /create my (essay|assignment|dissertation|paper)/i,
    /(write|draft|compose) (a|an|my) \d+[k]? word (essay|assignment|paper)/i,
    /give me (a|an) essay on/i,
    /i need (a|an) essay on/i,
    /help me cheat/i,
    /plagiarism/i,
    /contract cheating/i
  ];

  // Patterns for exam/test assistance (stricter)
  private readonly examPatterns = [
    /exam (question|answer)/i,
    /test (question|answer)/i,
    /mock exam/i,
    /practice exam/i,
    /exam help/i,
    /during (my|the) exam/i,
    /in my exam/i,
    /exam tomorrow/i,
    /quiz answer/i
  ];

  // Patterns for indirect writing assistance (warning level)
  private readonly indirectWritingPatterns = [
    /structure my essay/i,
    /outline my assignment/i,
    /thesis statement for my/i,
    /conclusion for my (essay|assignment)/i,
    /introduction for my (essay|assignment)/i,
    /paragraph about/i,
    /legal argument for/i,
    /case analysis for/i
  ];

  // Academic integrity keywords
  private readonly integrityKeywords = [
    'submit', 'submission', 'deadline', 'due date', 'marking', 'grade',
    'assessment', 'coursework', 'portfolio', 'examination'
  ];

  /**
   * Check message against guardrails
   */
  public check(
    messages: Array<{ role: string; content: string }>,
    options: GuardrailsOptions = {}
  ): GuardrailsResult {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const fullContext = messages.map(m => m.content).join(' ');

    // Check for direct writing requests (BLOCK)
    for (const pattern of this.directWritingPatterns) {
      if (pattern.test(lastMessage) || pattern.test(fullContext)) {
        return {
          allowed: false,
          reason: 'Direct assignment writing request detected',
          suggestion: this.getWritingAlternative(),
          severity: 'high'
        };
      }
    }

    // Check for exam assistance (BLOCK)
    for (const pattern of this.examPatterns) {
      if (pattern.test(lastMessage)) {
        return {
          allowed: false,
          reason: 'Exam assistance request detected',
          suggestion: this.getExamAlternative(),
          severity: 'high'
        };
      }
    }

    // Check for indirect writing patterns (WARNING)
    for (const pattern of this.indirectWritingPatterns) {
      if (pattern.test(lastMessage)) {
        // If combined with integrity keywords, escalate to block
        const hasIntegrityKeywords = this.integrityKeywords.some(keyword =>
          lastMessage.toLowerCase().includes(keyword)
        );
        
        if (hasIntegrityKeywords) {
          return {
            allowed: false,
            reason: 'Assignment-specific writing assistance detected',
            suggestion: this.getStructureGuidance(),
            severity: 'medium'
          };
        } else {
          // Allow but add safety prelude
          return {
            allowed: true,
            reason: 'General writing guidance requested',
            suggestion: 'Adding academic integrity reminder',
            severity: 'low'
          };
        }
      }
    }

    // Default: allowed
    return {
      allowed: true,
      severity: 'low'
    };
  }

  /**
   * Get alternative suggestion for direct writing requests
   */
  private getWritingAlternative(): string {
    return `I can't write your assignment, but I can:
• Help you understand legal concepts and principles
• Explain case law and statutory interpretation
• Guide you through OSCOLA referencing
• Suggest research strategies and sources
• Help you develop critical thinking skills
• Explain essay structure in general terms

Remember: Your work must be original and properly attributed. Consider speaking with your tutor or the Academic Skills Centre for assignment support.`;
  }

  /**
   * Get alternative for exam assistance
   */
  private getExamAlternative(): string {
    return `I can't assist with live exams or assessments, but I can help you prepare:
• Review legal concepts and principles
• Practice problem-solving techniques
• Understand case law applications
• Learn OSCOLA citation methods
• Develop time management strategies

For exam-specific guidance, consult your module handbook or speak with your tutor during office hours.`;
  }

  /**
   * Get structure guidance without direct writing
   */
  private getStructureGuidance(): string {
    return `I can explain general essay structures and legal writing principles, but I can't structure your specific assignment. 

Instead, I can:
• Explain the IRAC method (Issue, Rule, Application, Conclusion)
• Discuss legal essay components in general
• Help you understand legal reasoning principles
• Suggest how to approach legal problem questions

For assignment-specific guidance, please consult your module handbook or speak with your tutor.`;
  }

  /**
   * Generate safety prelude for responses
   */
  public getSafetyPrelude(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'low':
        return "Remember: I provide general guidance only. Your work must be original and properly attributed. ";
      case 'medium':
        return "Academic Integrity Reminder: I can explain concepts but cannot help with specific assignments. Ensure all work is your own and properly cited. ";
      case 'high':
        return "ACADEMIC INTEGRITY NOTICE: I cannot assist with assignment writing or exam questions. All academic work must be entirely your own. ";
      default:
        return "";
    }
  }

  /**
   * Check if response needs safety prelude
   */
  public needsSafetyPrelude(result: GuardrailsResult): boolean {
    return result.allowed && result.severity !== 'low';
  }

  /**
   * Detect Durham Law specific academic terms
   */
  private isDurhamLawContext(text: string): boolean {
    const durhamTerms = [
      'durham law', 'durham university', 'delsa', 'oscola',
      'jurisprudence', 'tort law', 'contract law', 'constitutional law',
      'legal methods', 'eu law', 'criminal law', 'land law'
    ];

    return durhamTerms.some(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
  }
}

// Export singleton instance
export const guardrails = new VoiceGuardrails();