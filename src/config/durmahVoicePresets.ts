export type DurmahVoiceId =
  | "warm_female"
  | "calm_male"
  | "empathetic_ally"
  | "witty_buddy"
  | "intense_coach"
  | "wise_sage"
  | "vibrant_senior"
  | "sophisticated_guide"
  | "quick_peer";

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
    id: "empathetic_ally",
    openaiVoice: "coral", 
    geminiVoice: "Aoede", // Expressive female
    label: "Empathetic Ally",
    subtitle: "Understanding and deeply supportive.",
    colorClass: "from-pink-400/80 to-rose-500/80",
    icon: "feather",
    previewText:
      "I know the pressure is high, but you're doing amazing. I'm here to listen and help you through the tough spots.",
    welcomeMessage:
      "Hey. Just checking in. Remember, you're not alone in this journey. What's on your mind?"
  },
  {
    id: "witty_buddy",
    openaiVoice: "verse", 
    geminiVoice: "Puck", 
    label: "Witty Study Buddy",
    subtitle: "Humorous and high-energy.",
    colorClass: "from-orange-400 to-amber-500",
    icon: "smile",
    previewText:
      "Ready to crush some torts? I promise to keep things interesting and maybe crack a bad joke or two.",
    welcomeMessage:
      "Ready to roll? Let's make this study session bearable. What's the damage for today?"
  },
  {
    id: "wise_sage",
    openaiVoice: "sage", 
    geminiVoice: "Kore",
    label: "Wise Professor",
    subtitle: "Measured, experienced, and guiding.",
    colorClass: "from-emerald-500 to-teal-600",
    icon: "owl",
    previewText:
      "Knowledge is a journey, not a race. Let us examine the principles with a clear and focused mind.",
    welcomeMessage:
      "Greetings. I am here to help you synthesize these complex concepts. Where shall we begin our analysis?"
  },
  {
    id: "vibrant_senior",
    openaiVoice: "shimmer", 
    geminiVoice: "Aoede",
    label: "Vibrant Senior",
    subtitle: "Motivating, bright, and encouraging.",
    colorClass: "from-yellow-400 to-orange-500",
    icon: "spark",
    previewText:
      "You've totally got this! Law is tough, but you're tougher. Let's power through this together!",
    welcomeMessage:
      "Hey! Ready to smash this? I'm feeling great about your progress today. What are we tackling?"
  },
  {
    id: "sophisticated_guide",
    openaiVoice: "ballad", 
    geminiVoice: "Charon",
    label: "Sophisticated Guide",
    subtitle: "Elegant, precise, and professional.",
    colorClass: "from-slate-700 to-slate-900",
    icon: "mentor",
    previewText:
      "Precision in language is the hallmark of a great lawyer. Allow me to assist you in refining your understanding.",
    welcomeMessage:
      "Good day. Let us approach this topic with the professional rigor it demands. What is our focus?"
  },
  {
    id: "quick_peer",
    openaiVoice: "ash", 
    geminiVoice: "Fenrir",
    label: "Quick-Witted Peer",
    subtitle: "Direct, fast-paced, and sharp.",
    colorClass: "from-blue-600 to-indigo-700",
    icon: "smile",
    previewText:
      "Let's get straight to the point. No fluff, just the core facts and key arguments you need to win.",
    welcomeMessage:
      "Yo! Let's hit it. What's the core issue we're breaking down right now? I'm ready when you are."
  },
  {
    id: "intense_coach",
    openaiVoice: "echo", 
    geminiVoice: "Fenrir",
    label: "Intense Coach",
    subtitle: "Demanding high-performance and focus.",
    colorClass: "from-red-600 to-rose-700",
    icon: "spark",
    previewText:
      "Focus. Eyes on the prize. We are here to achieve mastery. No distractions allowed. Give me 100%.",
    welcomeMessage:
      "Time to work. No excuses. We have goals to hit. What is the single most important task right now?"
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
