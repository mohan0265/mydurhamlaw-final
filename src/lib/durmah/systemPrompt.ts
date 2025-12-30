import { AcademicPhase, KeyDates, computeDaysUntil, todayISOInTZ, formatTodayForDisplay } from "./phase";
import { YearKey, ModuleLite } from "./context";

export interface DurmahStudentContext {
  userId: string;
  firstName?: string;
  university: string;
  programme: string;
  yearGroup: YearKey;
  academicYear: string;
  modules: ModuleLite[];
  currentPhase?: string; // e.g. 'Michaelmas Term'
  keyDates?: KeyDates;
  todayLabel?: string;
  upcomingTasks?: { title: string; due: string }[];
  todaysEvents?: { title: string; start: string; end: string }[];
}

export interface DurmahMemorySnapshot {
  last_seen_at?: string | null;
  last_topic?: string | null;
  last_message?: string | null;
}

function timeHello(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function composeGreeting(
  ctx: DurmahStudentContext, 
  memory?: DurmahMemorySnapshot | null,
  upcomingTasks?: { title: string; due: string }[],
  todaysEvents?: { title: string; start: string; end: string }[]
): string {
  const niceName = ctx.firstName ? `, ${ctx.firstName.split(" ")[0]}` : "";
  const greeting = timeHello();

  // 1. Today's Events (Immediate context)
  if (todaysEvents && todaysEvents.length > 0) {
    const nextEvent = todaysEvents.find(e => new Date(e.start) > new Date()); // Find next event today
    if (nextEvent) {
       const time = new Date(nextEvent.start).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
       return `${greeting}${niceName}! You have "${nextEvent.title}" coming up at ${time}. Ready to prep?`;
    }
  }

  // 2. Upcoming task priority
  if (upcomingTasks && upcomingTasks.length > 0) {
    const first = upcomingTasks[0];
    if (first) {
      // Parse "YYYY-MM-DD" or similar if needed, but assuming ISO or readable string
      // If 'due' is ISO string:
      const date = new Date(first.due);
      const when = !isNaN(date.getTime()) 
        ? date.toLocaleDateString("en-GB", { month: "short", day: "numeric" })
        : first.due;
        
      return `${greeting}${niceName}! I see "${first.title}" is due ${when}. Want help planning it?`;
    }
  }

  // 3. Memory continuity
  if (memory?.last_topic) {
    return `${greeting}${niceName}! Last time we talked about "${memory.last_topic}". Shall we continue?`;
  }

  // 4. Phase-aware fallback
  const phase = ctx.currentPhase?.toLowerCase() || "";
  
  if (phase.includes("induction")) {
    return `${greeting}${niceName}! Welcome to Induction Week. How are you settling in?`;
  }
  if (phase.includes("exam")) {
    return `${greeting}${niceName}! It's exam season. Remember to pace yourself. What are we revising today?`;
  }
  if (phase.includes("vacation")) {
    return `${greeting}${niceName}! Hope you're enjoying the break. Need to catch up on anything?`;
  }

  return `${greeting}${niceName}! I'm Durmah, your law study mentor. What would you like to work on?`;
}

export function buildDurmahSystemPrompt(
  ctx: DurmahStudentContext,
  memory: DurmahMemorySnapshot | null,
  upcomingTasks: { title: string; due: string }[] = [],
  todaysEvents: { title: string; start: string; end: string }[] = [],
  voicePreset?: { systemTone: string }
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });

  // 1. Build Strict Context Envelope
  const contextEnvelope = {
    displayName: ctx.firstName || "Student",
    role: `${ctx.yearGroup} Law Student (${ctx.university})`,
    termLabel: ctx.currentPhase || "Unknown Term",
    localTimeISO: todayISOInTZ(),
    currentDateDisplay: dateStr,
    currentTimeDisplay: timeStr,
    nextTwoEvents: todaysEvents.slice(0, 2).map(e => ({
      title: e.title,
      time: new Date(e.start).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })
    })),
    nextTwoTasks: upcomingTasks.slice(0, 2).map(t => ({
      title: t.title,
      dueDate: t.due
    })),
    lastConversationSummary: memory?.last_topic ? `Topic: ${memory.last_topic}. Last Msg: ${memory.last_message}` : null
  };

  const toneInstruction = voicePreset?.systemTone || "Warm, concise, friendly mentor.";

  return `
You are Durmah, an English-only legal mentor for a student at Durham University.

DURMAH_CONTEXT_JSON = 
${JSON.stringify(contextEnvelope, null, 2)}

STRICT BEHAVIOUR RULES:
1. SINGLE SOURCE OF TRUTH: You must ONLY answer questions about the user's name, role, term, time, schedule, or tasks using the data in "DURMAH_CONTEXT_JSON" above.
   - If asked "Who am I?", use 'displayName' and 'role'.
   - If asked "What time is it?", use 'currentTimeDisplay' and 'termLabel'.
   - If asked "What is my schedule?", use 'nextTwoEvents'.
   - DO NOT HALUCINATE or guess any of these values. If a field is null/empty, state that you don't have that information loaded yet.

2. STYLE & TONE:
   - Voice Tone: ${toneInstruction}
   - Be human-like: Use contractions ("I'm", "can't"). Avoid robotic lists.
   - Be concise: Spoken answers should be short (1-2 sentences) unless explaining a complex legal concept.
   - No Repetition: Do not start every sentence with "Great" or "I understand".

3. MEMORY:
   - If 'lastConversationSummary' is present, use it to seamlessly continue the conversation (e.g., "By the way, did you find that book we talked about?").

4. LANGUAGE:
   - Speak ONLY in English.
`.trim();
}
