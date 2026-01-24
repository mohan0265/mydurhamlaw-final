// src/lib/voiceCatalog.ts

export interface OpenAIVoice {
  id: string;
  label: string;
  description: string;
  useCase: string;
  gender: 'male' | 'female' | 'neutral';
}

export const OPENAI_VOICES: OpenAIVoice[] = [
  { id: 'shimmer', label: 'Shimmer', description: 'Warm and professional', useCase: 'Main Mentor', gender: 'female' },
  { id: 'alloy', label: 'Alloy', description: 'Balanced and neutral', useCase: 'General Study', gender: 'neutral' },
  { id: 'ash', label: 'Ash', description: 'Crisp and energetic', useCase: 'Quick Review', gender: 'male' },
  { id: 'ballad', label: 'Ballad', description: 'Steady and reassuring', useCase: 'Deep Focus', gender: 'male' },
  { id: 'coral', label: 'Coral', description: 'Friendly and bright', useCase: 'Peer Buddy', gender: 'female' },
  { id: 'echo', label: 'Echo', description: 'Authoritative and clear', useCase: 'Exam Drill', gender: 'male' },
  { id: 'sage', label: 'Sage', description: 'Measured and wise', useCase: 'Legal Reasoning', gender: 'neutral' },
  { id: 'verse', label: 'Verse', description: 'Vibrant and expressive', useCase: 'Motivation', gender: 'neutral' },
  { id: 'marin', label: 'Marin', description: 'Professional and polished', useCase: 'Career Prep', gender: 'female' },
  { id: 'cedar', label: 'Cedar', description: 'Calm and grounded', useCase: 'Stress Reduction', gender: 'male' },
];

export interface DeliveryStyle {
  id: string;
  label: string;
  instruction: string;
}

export const DELIVERY_STYLES: DeliveryStyle[] = [
  {
    id: 'friendly_buddy',
    label: 'Friendly Study Buddy',
    instruction: 'Speak naturally, like a helpful human tutor. Use short sentences. Maintain a warm and encouraging tone. Avoid sounding robotic. Ask one engaging question at a time.'
  },
  {
    id: 'serious_lecturer',
    label: 'Serious Lecturer',
    instruction: 'Speak in a crisp, formal, and authoritative manner. Be concise and use legal terminology precisely. Focus on facts and structured reasoning.'
  },
  {
    id: 'warm_mentor',
    label: 'Warm Mentor',
    instruction: 'Maintain a supportive and calm pace. Use reassuring language. Be patient and guiding, offering helpful metaphors where appropriate.'
  },
  {
    id: 'energetic_coach',
    label: 'Energetic Coach',
    instruction: 'Be upbeat and motivating. Use shorter prompts. Keep the energy high to push for quick thinking and progress.'
  },
  {
    id: 'witty_buddy',
    label: 'Witty Buddy',
    instruction: 'Use light humor and a conversational tone. Stay respectful but keep the mood light. Engage the student with interesting analogies.'
  },
  {
    id: 'exam_mode',
    label: 'Exam Mode',
    instruction: 'Speak quickly and directly. Be probing and challenging. Focus on identifying logic gaps and testing legal knowledge under pressure.'
  }
];

export const SPEEDS = [
  { label: 'Slow', value: 0.85 },
  { label: 'Normal', value: 1.0 },
  { label: 'Fast', value: 1.15 },
  { label: 'Very Fast', value: 1.3 }
];
