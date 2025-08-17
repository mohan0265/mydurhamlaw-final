// src/types/chat.ts

export type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | Date;
};

export type VoiceMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
};
