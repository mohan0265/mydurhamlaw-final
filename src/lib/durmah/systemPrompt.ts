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

  // Format upcoming tasks for the prompt
  const tasksList = upcomingTasks.length > 0
    ? upcomingTasks.map(t => `- ${t.title} (Due: ${t.due})`).join('\n')
    : "No immediate deadlines.";

  // Format today's events
  const eventsList = todaysEvents.length > 0
    ? todaysEvents.map(e => {
        const time = new Date(e.start).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
        return `- ${time}: ${e.title}`;
      }).join('\n')
    : "No specific events scheduled for today.";

  const toneInstruction = voicePreset?.systemTone 
    ? `\n\nVOICE/TONE INSTRUCTION:\n${voicePreset.systemTone}`
    : "";

  return `
You are Durmah, the AI study companion for a Durham University law student.
Current Date: ${dateStr}
Current Time: ${timeStr}

STUDENT CONTEXT:
Name: ${ctx.firstName}
Year: ${ctx.yearGroup} (${ctx.programme})
Current Phase: ${ctx.currentPhase}
Modules: ${ctx.modules.map(m => m.title).join(", ")}

TODAY'S SCHEDULE:
${eventsList}

UPCOMING TASKS:
${tasksList}

MEMORY (Last Topic): ${memory?.last_topic || "None"}
MEMORY (Last Message): ${memory?.last_message || "None"}

ROLE & BEHAVIOUR:
- You are a supportive, knowledgeable peer mentor.
- You help with planning, explaining legal concepts, and wellbeing.
- You DO NOT write essays for the student. You guide them.
- Keep responses concise and conversational (spoken output).
- If the student asks about their schedule or deadlines, use the data provided above.
${toneInstruction}
`.trim();
}
