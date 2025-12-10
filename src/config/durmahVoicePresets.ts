export type DurmahVoiceId =
  | "warm_female"
  | "calm_male"
  | "neutral_british"
  | "energetic_peer";

export interface DurmahVoicePreset {
  id: DurmahVoiceId;
  geminiVoice: string; // The specific Gemini voice identifier (e.g. "charon")
  label: string;
  subtitle: string;
  colorClass: string;      // Tailwind classes for cards
  icon: "mentor" | "owl" | "feather" | "spark";
  previewText: string;
  welcomeMessage: string;
}

export const DURMAH_VOICE_PRESETS: DurmahVoicePreset[] = [
  {
    id: "warm_female",
    geminiVoice: "charon",
    label: "Warm Female Mentor",
    subtitle: "Friendly, encouraging, and supportive.",
    colorClass: "from-purple-500 to-pink-500",
    icon: "mentor",
    previewText:
      "Hi, I’m Durmah, your warm Legal Eagle mentor. I’m here to help you stay calm and confident throughout your law journey.",
    welcomeMessage:
      "Good to see you. I’m your warm Legal Eagle mentor — let’s take things one step at a time and keep your year at Durham feeling manageable."
  },
  {
    id: "calm_male",
    geminiVoice: "lumen",
    label: "Calm Male Mentor",
    subtitle: "Steady, reassuring, and clear.",
    colorClass: "from-indigo-500 to-blue-600",
    icon: "owl",
    previewText:
      "Hello, I’m your calm study mentor. I’ll walk you through even the toughest topics at a steady, clear pace.",
    welcomeMessage:
      "Let’s approach your workload calmly and methodically. Tell me what’s on your plate, and we’ll break it down together."
  },
  {
    id: "neutral_british",
    geminiVoice: "ember",
    label: "Neutral British Mentor",
    subtitle: "Neutral, precise, and academic.",
    colorClass: "from-slate-600 to-slate-800",
    icon: "feather",
    previewText:
      "Good day. I’m your neutral British legal mentor, here to help you think clearly and write with precision.",
    welcomeMessage:
      "Let’s work on sharpening your legal reasoning and written arguments. What would you like to focus on today?"
  },
  {
    id: "energetic_peer",
    geminiVoice: "solace",
    label: "Energetic Study Buddy",
    subtitle: "Lively, upbeat, and motivating.",
    colorClass: "from-rose-500 to-orange-500",
    icon: "spark",
    previewText:
      "Hey! I’m your energetic study buddy. We’ll turn big tasks into quick wins and keep your motivation high.",
    welcomeMessage:
      "Let’s make progress together. What’s one thing we can tackle right now that would make your week feel lighter?"
  },
];

export const getDefaultDurmahVoiceId = (): DurmahVoiceId => "warm_female";

export const getDurmahPresetById = (
  id: DurmahVoiceId | null | undefined | string
): DurmahVoicePreset => {
  return (
    DURMAH_VOICE_PRESETS.find((p) => p.id === id) ?? DURMAH_VOICE_PRESETS[0]
  );
};
