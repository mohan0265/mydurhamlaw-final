
// Enhanced Voice Coach Types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  context?: string;
}

export interface VoiceStatus {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  isIdle: boolean;
}

export interface AudioSettings {
  volume: number;
  rate: number;
  pitch: number;
  autoPlay: boolean;
}

export type PageContext = 'wellbeing' | 'assignment' | 'dashboard' | 'calendar' | 'general';

export interface ContextConfig {
  type: PageContext;
  name: string;
  systemPrompt: string;
  tone: string;
}

// Speech Recognition types for better TypeScript support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
  error: string;
  message: string;
}

// Always With You sharing settings interface
export interface SharingSettings {
  show_live_status_to_parents: boolean;
  share_today_calendar: boolean;
  share_custom_notes: boolean;
  do_not_disturb: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

// User Profile types for Supabase
export interface UserProfile {
  id?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  user_type?: string;
  year_group?: string; // Legacy field - keeping for backward compatibility
  avatar_url?: string;
  durmah_voice?: string;
  tts_voice?: string; // Legacy field - keeping for backward compatibility  
  voice_speed?: string;
  voice_mode_enabled?: boolean;
  ai_safety_level?: string;
  feedback_reminder_opt_in?: boolean;
  agreed_to_terms?: boolean;
  created_at?: string;
  updated_at?: string;
  voice_id?: string;
  // Always With You fields
  parent1_email?: string;
  parent1_relationship?: string;
  parent1_display_name?: string;
  parent2_email?: string;
  parent2_relationship?: string;
  parent2_display_name?: string;
  sharing_settings?: SharingSettings;
  // Academic year management
  academic_year?: string;
  trial_ends_at?: string;
  can_preview_years?: boolean;
  // Integrity shield fields
  integrity_acknowledged?: boolean;
  integrity_pledge_at?: string;
  ai_disclosure_consent?: boolean;
  ai_help_default?: string;
}
