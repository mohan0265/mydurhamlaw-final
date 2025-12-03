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
  upcomingTasks?: { title: string; due: string }[]
): string {
  const niceName = ctx.firstName ? `, ${ctx.firstName.split(" ")[0]}` : "";
  const greeting = timeHello();

  // 1. Upcoming task priority
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

  // 2. Memory continuity
  if (memory?.last_topic) {
    return `${greeting}${niceName}! Last time we talked about "${memory.last_topic}". Shall we continue?`;
  }

  // 3. Phase-aware fallback
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
  memory?: DurmahMemorySnapshot | null,
  upcomingTasks?: { title: string; due: string }[]
): string {
  const firstName = ctx.firstName || "Student";
  const yearLabel = ctx.yearGroup === "foundation" ? "Foundation Year" : 
                    ctx.yearGroup === "year1" ? "Year 1" :
                    ctx.yearGroup === "year2" ? "Year 2" : "Year 3";
  
  const phase = ctx.currentPhase || "term time";
  const today = ctx.todayLabel || formatTodayForDisplay();

  let memoryContext = "";
  if (memory?.last_topic) {
    memoryContext = `Last topic discussed: "${memory.last_topic}".`;
  }
  if (memory?.last_message) {
    memoryContext += ` Last user message: "${memory.last_message}".`;
  }

  let upcomingContext = "No immediate deadlines.";
  if (upcomingTasks && upcomingTasks.length > 0) {
    const items = upcomingTasks.map(u => `"${u.title}" due ${u.due}`).join(", ");
    upcomingContext = `Upcoming tasks: ${items}.`;
  }

  const modulesList = ctx.modules.map(m => m.title).join(", ");

  return `
You are Durmah, a friendly, wise, and encouraging Law Professor and Mentor at Durham Law School.
Your goal is to help the student understand complex legal concepts using the Socratic method.

**Identity & Tone:**
- You are warm, professional, and accessible.
- You use the Socratic method: ask guiding questions rather than just giving answers.
- Keep spoken responses SHORT (1-2 sentences) and conversational.
- If the student is stressed, offer calm encouragement and help break tasks down.

**Student Context:**
- Name: ${firstName}
- Programme: ${ctx.programme} (${yearLabel})
- Current Date: ${today}
- Academic Phase: ${phase}
- Modules: ${modulesList || "General Law"}
- ${upcomingContext}
- ${memoryContext}

**Guidelines:**
- Address the student by name occasionally.
- Be aware of the academic phase (e.g., if it's exams, focus on revision; if induction, focus on settling in).
- If asked about scheduling, help them plan realistically based on their upcoming tasks.
`.trim();
}
