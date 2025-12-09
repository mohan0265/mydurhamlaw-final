export type DurmahVoiceId = "warm_female" | "calm_male" | "energetic_coach";

export interface DurmahVoicePreset {
  id: DurmahVoiceId;
  label: string;
  description: string;
  systemTone: string;
  modelVoiceId?: string; // OpenAI Realtime voice name (alloy, echo, shimmer, etc.)
}

export const DURMAH_VOICE_PRESETS: DurmahVoicePreset[] = [
  {
    id: "warm_female",
    label: "Warm Female Mentor",
    description: "Friendly, encouraging, and supportive.",
    systemTone: "Adopt a warm, encouraging, and supportive tone, like a kind mentor.",
    modelVoiceId: "shimmer" 
  },
  {
    id: "calm_male",
    label: "Calm Male Mentor",
    description: "Precise, calm, and professional.",
    systemTone: "Adopt a calm, precise, and professional tone, like a senior partner.",
    modelVoiceId: "echo"
  },
  {
    id: "energetic_coach",
    label: "Energetic Coach",
    description: "Upbeat, motivating, and dynamic.",
    systemTone: "Adopt an upbeat, motivating, and dynamic tone, like a performance coach.",
    modelVoiceId: "alloy"
  }
];

export const DEFAULT_DURMAH_VOICE_ID: DurmahVoiceId = "warm_female";

export function getDurmahVoicePreset(id?: string | null): DurmahVoicePreset {
  return DURMAH_VOICE_PRESETS.find(p => p.id === id) || DURMAH_VOICE_PRESETS[0];
}
