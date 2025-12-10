export type DurmahVoiceId =
  | "warm_female"
  | "calm_male"
  | "neutral_british"
  | "energetic_peer";

export const DURMAH_VOICE_PRESETS = [
  {
    id: "warm_female",
    geminiVoice: "charon", // Replace with final Gemini voice label if needed
    label: "Warm Female Mentor",
    subtitle: "Friendly, encouraging, and supportive.",
  },
  {
    id: "calm_male",
    geminiVoice: "lumen",
    label: "Calm Male Mentor",
    subtitle: "Steady, reassuring, and clear.",
  },
  {
    id: "neutral_british",
    geminiVoice: "ember",
    label: "Neutral British Mentor",
    subtitle: "Neutral, precise, and academic.",
  },
  {
    id: "energetic_peer",
    geminiVoice: "solace",
    label: "Energetic Study Buddy",
    subtitle: "Lively, upbeat, and motivating.",
  },
];

export const getDefaultDurmahVoiceId = (): DurmahVoiceId => "warm_female";
