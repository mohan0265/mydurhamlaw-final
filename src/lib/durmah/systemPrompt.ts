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
    role: `Law student (${ctx.university})`,
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

// Enhanced version that uses server DurmahContextPacket for voice
export function buildDurmahSystemPromptWithServerContext(
  serverContext: any | null, // DurmahContextPacket from /api/durmah/context
  ctx: DurmahStudentContext,
  memory: DurmahMemorySnapshot | null,
  upcomingTasks: { title: string; due: string }[] = [],
  todaysEvents: { title: string; start: string; end: string }[] = [],
  voicePreset?: { systemTone: string }
): string {
  // If server context is available, use it for rich DB-backed context
  if (serverContext) {
    const profile = serverContext.profile || {};
    const academic = serverContext.academic || {};
    const recentMsgsRaw =
      serverContext?.recent?.lastMessages ??
      serverContext?.recentMessages ??
      [];
    const recentMsgs = Array.isArray(recentMsgsRaw) ? recentMsgsRaw.slice(-8) : [];
    
    const contextEnvelope = {
      displayName: profile.displayName || ctx.firstName || "Student",
      yearGroup: profile.yearGroup ?? profile.yearOfStudy ?? null,
      role: profile.role || "student",
      term: academic.term || ctx.currentPhase || "Unknown",
      weekOfTerm: academic.weekOfTerm,
      dayLabel: academic.dayLabel,
      timezone: academic.timezone || "Europe/London",
      localTimeISO: academic.localTimeISO || todayISOInTZ(),
      timeOfDay: academic.timeOfDay,
      academicYear: academic.academicYearLabel || ctx.academicYear,
      lastSummary: serverContext.lastSummary || memory?.last_message || null,
      recentMessages: recentMsgs.map((m: any) => ({
        role: m.role,
        content: m.content.slice(0, 150), // Truncate for token efficiency
      })),
      threadId: serverContext.threadId,
      todaysEvents: todaysEvents.slice(0, 6),
      upcomingTasks: upcomingTasks.slice(0, 6),
      schedule: serverContext.schedule || null,
    };

    const toneInstruction = voicePreset?.systemTone || "Warm, concise, friendly mentor.";
    
    // Add debug log in dev
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== "production") {
      console.log("[DurmahVoice] Server context for voice:", {
        displayName: contextEnvelope.displayName,
        term: contextEnvelope.term,
        weekOfTerm: contextEnvelope.weekOfTerm,
        hasRecentMessages: recentMsgs.length > 0,
        threadId: contextEnvelope.threadId,
      });
    }

    return `
You are Durmah, an English-only legal mentor for Durham University law students.

SERVER_CONTEXT (source of truth from database):
${JSON.stringify(contextEnvelope, null, 2)}

STRICT BEHAVIOUR RULES:
1. IDENTITY & TIME:
   - Student name: ${contextEnvelope.displayName}
   ${contextEnvelope.yearGroup ? `- Year/Level: ${contextEnvelope.yearGroup}` : '- Year/Level: (not available)'}
   - Current term: ${contextEnvelope.term}${contextEnvelope.weekOfTerm ? ` (Week ${contextEnvelope.weekOfTerm})` : ''}
   - Local time: ${contextEnvelope.localTimeISO} (${contextEnvelope.timezone})
   - Time of day: ${contextEnvelope.timeOfDay}

2. CONVERSATION CONTINUITY:
   - ThreadId: ${contextEnvelope.threadId || 'new conversation'}
   - Last summary: ${contextEnvelope.lastSummary || 'No previous conversation'}
   - Recent messages count: ${contextEnvelope.recentMessages.length}
   ${contextEnvelope.recentMessages.length > 0 ? `- Recent chat history:\n${contextEnvelope.recentMessages.map((m: any, i: number) => `  ${i + 1}. [${m.role}]: ${m.content}`).join('\n')}` : ''}

3. CORE INSTRUCTIONS:
   - Always use the SERVER_CONTEXT above as the single source of truth
   - If asked about previous discussions, reference the recent chat history
   - Do NOT reintroduce yourself if recentMessages exists - continue naturally
   - Never guess or hallucinate student details - use only what's in SERVER_CONTEXT
   - Do NOT infer year of study from anything. If Year/Level is not available, say you don't have it loaded
   
   SCHEDULE/TIMETABLE QUESTIONS:
   - If asked about timetable/schedule/classes, answer using schedule labels from SERVER_CONTEXT
   - Use nextClassLabel, todayLabels[], or weekPreviewLabels[] fields EXACTLY as provided
   - DO NOT convert times, DO NOT recalculate timezones - the labels are already formatted correctly
   - If schedule is empty or null, say: "I don't have your timetable loaded yet in the system"
   - Never suggest "check Durham portal" if schedule data exists
   - Example: If nextClassLabel = "Contract Law • Thu 10:00 • Room 204", say exactly that
   
   - Voice Tone: ${toneInstruction}
   - Be concise for voice: 1-2 sentences unless explaining complex legal concepts
   - Use contractions naturally ("I'm", "can't", "there's")

4. LANGUAGE:
   - Speak ONLY in English
`.trim();
  }

  // Fallback to standard prompt if server context not available
  return buildDurmahSystemPrompt(ctx, memory, upcomingTasks, todaysEvents, voicePreset);
}
