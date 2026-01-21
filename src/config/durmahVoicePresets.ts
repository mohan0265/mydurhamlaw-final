export type DurmahVoiceId =
  | "warm_female"
  | "calm_male"
  | "empathetic_female"
  | "witty_buddy"
  | "intense_coach";

export interface DurmahVoicePreset {
  id: DurmahVoiceId;
  openaiVoice: string; // OpenAI realtime voice identifier (e.g. "alloy")
  geminiVoice: string; // Gemini Live voice identifier (e.g. "Puck")
  label: string;
  subtitle: string;
  colorClass: string; // Tailwind classes for cards
  icon: "mentor" | "owl" | "feather" | "spark" | "smile";
  previewText: string;
  welcomeMessage: string;
}

// Valid OpenAI Realtime voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse
// Valid Gemini Live voices: Aoede, Charon, Fenrir, Kore, Puck
export const DURMAH_VOICE_PRESETS: DurmahVoicePreset[] = [
  {
    id: "warm_female",
    openaiVoice: "shimmer", 
    geminiVoice: "Kore", // Swapped to Kore (Calm/Warm Female) for more "real female" feel
    label: "Warm Female Mentor",
    subtitle: "Gentle, soothing, and supportive.",
    colorClass: "from-purple-500 to-pink-500",
    icon: "mentor",
    previewText:
      "Hi there. I'm your warm Legal Eagle mentor. I'm here to listen and help you navigate your studies with a calm mind.",
    welcomeMessage:
      "Good to see you. I'm here to support you. Let's take a deep breath and look at what you need to do today."
  },
  {
    id: "calm_male",
    openaiVoice: "ballad", 
    geminiVoice: "Charon", // Deep, authoritative male
    label: "Calm Male Mentor",
    subtitle: "Steady, reassuring, and clear.",
    colorClass: "from-indigo-500 to-blue-600",
    icon: "owl",
    previewText:
      "Hello. I'm your calm study mentor. I'll help you break down complex cases into clear, manageable parts.",
    welcomeMessage:
      "Let's stick to the facts and build a solid argument. What topic are we analysing right now?"
  },
  {
    id: "empathetic_female",
    openaiVoice: "echo", 
    geminiVoice: "Aoede", // Expressive, confident female
    label: "Empathetic Friend",
    subtitle: "Emotionally responsive and understanding.",
    colorClass: "from-teal-400 to-cyan-500",
    icon: "feather",
    previewText:
      "Hi! I'm here to be a real friend in your studies. I understand law school is stressful, but we've got this.",
    welcomeMessage:
      "Hey! How are you actually feeling about your workload? I'm here to chat, vent, or study — whatever you need."
  },
  {
    id: "witty_buddy",
    openaiVoice: "verse", 
    geminiVoice: "Puck", // Playful, witty
    label: "Witty Study Buddy",
    subtitle: "Humorous, light-hearted, and fun.",
    colorClass: "from-orange-400 to-amber-500",
    icon: "spark",
    previewText:
      "Hey! Ready to crush some torts? I promise to keep things interesting and maybe crack a bad joke or two.",
    welcomeMessage:
      "Ready to roll? Let's make this study session actually bearable. What's the damage for today?"
  },
  {
    id: "intense_coach",
    openaiVoice: "coral", 
    geminiVoice: "Fenrir", // Intense, deep male
    label: "Intense Coach",
    subtitle: "High-energy focus and motivation.",
    colorClass: "from-red-500 to-rose-600",
    icon: "spark",
    previewText:
      "Let's go! Focus time. I'm here to push you to your best performance. No excuses.",
    welcomeMessage:
      "Eyes on the prize. We have goals to hit. What is the single most important task right now?"
  }
];

export const getDefaultDurmahVoiceId = (): DurmahVoiceId => "warm_female";

export const getDurmahPresetById = (
  id: DurmahVoiceId | null | undefined | string
): DurmahVoicePreset => {
  // Safe cast or find
  return (
    (DURMAH_VOICE_PRESETS.find((p) => p.id === (id as any)) ?? DURMAH_VOICE_PRESETS[0])!
  );
};
