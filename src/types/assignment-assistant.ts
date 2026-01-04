// Assignment Assistant Types

export interface AssignmentBrief {
  id: string;
  assignment_id: string;
  user_id: string;
  original_filename: string;
  file_url: string;
  parsed_text: string;
  parsed_data: ParsedBriefData;
  created_at: string;
}

export interface ParsedBriefData {
  deadline?: string;
  wordLimit?: number;
  moduleCode?: string;
  moduleName?: string;
  questionText?: string;
  requirements?: string[];
  citationStyle?: string;
  specialInstructions?: string;
  assessmentType?: string; // 'essay', 'problem question', etc.
}

export interface AssignmentStage {
  id: string;
  assignment_id: string;
  user_id: string;
  current_stage: number; // 1-6
  stage_1_complete: boolean;
  stage_2_complete: boolean;
  stage_3_complete: boolean;
  stage_4_complete: boolean;
  stage_5_complete: boolean;
  stage_6_complete: boolean;
  stage_data: StageData;
  updated_at: string;
}

export interface StageData {
  stage1?: {
    quizScore?: number;
    legalIssuesIdentified?: string[];
    understandingLevel?: 'low' | 'medium' | 'high';
  };
  stage2?: {
    casesFound?: string[];
    statutesFound?: string[];
    secondarySources?: string[];
    researchCompletePercent?: number;
  };
  stage3?: {
    outlineStructure?: OutlineSection[];
    wordCountEstimate?: number;
  };
  stage4?: {
    currentWordCount?: number;
    sectionsCompleted?: string[];
    aiAssistanceUsed?: string[];
  };
  stage5?: {
    citationCount?: number;
    oscolaCompliant?: boolean;
  };
  stage6?: {
    finalChecksComplete?: boolean;
    aiDeclarationAdded?: boolean;
  };
}

export interface OutlineSection {
  id: string;
  title: string;
  type: 'introduction' | 'issue' | 'rule' | 'application' | 'conclusion' | 'custom';
  estimatedWords: number;
  notes?: string;
  order: number;
}

export interface AssignmentDurmahSession {
  id: string;
  assignment_id: string;
  user_id: string;
  stage: number;
  transcript: DurmahMessage[];
  created_at: string;
}

export interface DurmahMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ResearchNote {
  id: string;
  assignment_id: string;
  user_id: string;
  source_type: 'case' | 'statute' | 'article' | 'book' | 'other';
  citation: string;
  notes: string;
  created_at: string;
}

export interface AssignmentDraft {
  id: string;
  assignment_id: string;
  user_id: string;
  version: number;
  content: string;
  word_count: number;
  ai_usage_log: AIUsageLog[];
  created_at: string;
}

export interface AIUsageLog {
  action: string;
  timestamp: string;
  details: string;
  stage?: number;
}

export interface OSCOLACitation {
  id: string;
  assignment_id: string;
  user_id: string;
  citation_text: string;
  short_form: string;
  source_type: 'case' | 'statute' | 'book' | 'article' | 'web';
  footnote_number?: number;
  created_at: string;
}

export type AssignmentStageNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StageConfig {
  stage: AssignmentStageNumber;
  title: string;
  description: string;
  icon: string;
  durmahPrompt: string;
}
