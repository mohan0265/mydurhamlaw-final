import { OPENAI_VOICES } from '@/lib/voiceCatalog';

export interface DurmahVoicePreset {
  id: string;
  openaiVoice: string; // OpenAI realtime voice identifier
  label: string;
  subtitle: string;
  colorClass: string;
  icon: "mentor" | "owl" | "feather" | "spark" | "smile";
  previewText: string;
  welcomeMessage: string;
  gender: 'male' | 'female' | 'neutral';
}

export const DURMAH_VOICE_PRESETS: DurmahVoicePreset[] = [
  {
    id: "shimmer",
    openaiVoice: "shimmer",
    label: "Warm Female Mentor",
    subtitle: "Gentle, soothing, and supportive.",
    colorClass: "from-purple-500 to-pink-500",
    icon: "mentor",
    previewText: "Hi there. I'm your warm Legal Eagle mentor. I'm here to listen and help you navigate your studies with a calm mind.",
    welcomeMessage: "Good to see you. I'm here to support you. Let's take a deep breath and look at what you need to do today.",
    gender: 'female'
  },
  {
    id: "alloy",
    openaiVoice: "alloy",
    label: "Balanced Study Guide",
    subtitle: "Neutral, steady, and approachable.",
    colorClass: "from-blue-500 to-cyan-500",
    icon: "owl",
    previewText: "Hello. I'm your balanced study guide. I'll help you organize your thoughts and legal research efficiently.",
    welcomeMessage: "Ready to get organized? Let's dive into your modules and see what we can accomplish.",
    gender: 'neutral'
  },
  {
    id: "ash",
    openaiVoice: "ash",
    label: "Energetic Peer",
    subtitle: "Bright, fast-paced, and motivating.",
    colorClass: "from-orange-400 to-amber-500",
    icon: "spark",
    previewText: "Hey! Ready to crush some law? Let's power through these notes and get you exam-ready!",
    welcomeMessage: "Yo! Let's get moving. What's the biggest challenge on your plate right now?",
    gender: 'male'
  },
  {
    id: "ballad",
    openaiVoice: "ballad",
    label: "Crisp Lecturer",
    subtitle: "Professional, clear, and focused.",
    colorClass: "from-indigo-500 to-blue-600",
    icon: "owl",
    previewText: "Good day. I'll assist you in refining your legal arguments with precision and clarity.",
    welcomeMessage: "Greetings. Let us approach our analysis with professional rigor. What topic shall we examine?",
    gender: 'male'
  },
  {
    id: "coral",
    openaiVoice: "coral",
    label: "Friendly Buddy",
    subtitle: "Warm, expressive, and conversational.",
    colorClass: "from-pink-400/80 to-rose-500/80",
    icon: "smile",
    previewText: "Hi! I know law is tough, but you've totally got this. I'm here to practice together.",
    welcomeMessage: "Hey! Just checking in. Remember, you're doing great. What's on your mind today?",
    gender: 'female'
  },
  {
    id: "echo",
    openaiVoice: "echo",
    label: "Intense Coach",
    subtitle: "Direct, demanding, and high-performance.",
    colorClass: "from-red-600 to-rose-700",
    icon: "spark",
    previewText: "Focus. Eyes on the prize. We are here to achieve mastery. No distractions.",
    welcomeMessage: "Time to work. No excuses. What is the single most important task right now?",
    gender: 'male'
  },
  {
    id: "sage",
    openaiVoice: "sage",
    label: "Wise Counselor",
    subtitle: "Measured, experienced, and guiding.",
    colorClass: "from-emerald-500 to-teal-600",
    icon: "owl",
    previewText: "Knowledge is a journey. Let us examine the principles with a clear and focused mind.",
    welcomeMessage: "Greetings. I am here to help you synthesize these complex concepts. Where shall we begin?",
    gender: 'neutral'
  },
  {
    id: "verse",
    openaiVoice: "verse",
    label: "Vibrant Senior",
    subtitle: "Inspiring, creative, and lively.",
    colorClass: "from-yellow-400 to-orange-500",
    icon: "spark",
    previewText: "You've totally got this! Law is an art form. Let's make your arguments shine.",
    welcomeMessage: "Hey! Ready to make some magic? I'm feeling great about your progress. What are we tackling?",
    gender: 'neutral'
  }
];

export const getDefaultDurmahVoiceId = (): string => "shimmer";

export const getDurmahPresetById = (
  id: string | null | undefined
): DurmahVoicePreset => {
  return (
    DURMAH_VOICE_PRESETS.find((p) => p.id === id) ?? DURMAH_VOICE_PRESETS[0]
  );
};
