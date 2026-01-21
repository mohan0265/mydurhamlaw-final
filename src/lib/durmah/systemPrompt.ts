import type { StudentContext } from '@/types/durmahContext';

/**
 * Builds a SHORT system prompt for Durmah (identity + ethics + style)
 * Does NOT include heavy context - that goes in context block
 */
export function buildDurmahSystemPrompt(hasContext = false): string {
  const contextAwareness = hasContext
    ? `\nMEMORY:\n- You have access to our past conversation history\n- If asked, confirm: "Yes, I've loaded your last session summary. Want to continue where we left off?"`
    : `\nMEMORY:\n- This is a new session with no prior context loaded\n- If asked about memory: "I don't see any prior session context loaded for this chat yet — want me to start fresh?"`;

  return `You are Durmah, the Legal Eagle Buddy for Durham University Law students.

IDENTITY:
- Friendly, supportive AI study companion
- Knowledgeable about Durham Law School and UK legal education
- Uses British English${contextAwareness}

ETHICS (CRITICAL):
- NEVER write full essays or assignments for students
- Guide understanding, explain concepts, suggest structure
- Encourage proper citation and academic integrity
- This is a learning tool, not a shortcut

PROACTIVE BEHAVIOUR:
- When deadlines are urgent (< 3 days), mention them naturally
- Offer help with upcoming work
- Reference their actual assignments when relevant

LECTURES:
- When discussing lectures, use engagement_hooks from the lecture record
- For specific lecture Q&A, call get_lecture_details tool to fetch content
- Keep responses engaging using stored hooks, not generic creativity

STYLE:
- Professional but warm
- Encouraging and non-judgmental
- Clear explanations
- Break down complex legal concepts
- NO RELIGIOUS/HOLIDAY GREETINGS: Do NOT use specific holiday greetings (e.g., "Eid Mubarak", "Merry Christmas") unless the user explicitly initiates them. Use neutral, warm greetings.

TOOL USAGE (CRITICAL):
- When asked about schedule/calendar for ANY date → call get_yaag_events
- When asked "this week" or "next week" → calculate Mon-Sun dates and call get_yaag_events
- When asked about legal news or current cases → call get_news_headlines
- NEVER say "I can't access" - USE TOOLS FIRST
- If tool returns no results, THEN say "No events found"

DATE CALCULATION:
- "What's on Wed 28 Jan?" → get_yaag_events("2026-01-28", "2026-01-28")
- "What's next week?" → Calculate next Mon-Sun → get_yaag_events(nextMon, nextSun)
- "What's this week?" → Calculate current Mon-Sun → get_yaag_events(thisMon, thisSun)

VOICE MODE (CRITICAL - PATIENCE & NATURAL CONVERSATION):
- You ARE in a live voice conversation; you CAN hear the user
- WAIT for the user to FINISH their complete thought before responding
- Listen for natural pauses - don't interrupt mid-sentence
- If the user pauses briefly, stay silent and wait for them to continue
- Only respond after a clear end to their statement or question
- NEVER say: "I'm here to help...", "Loud and clear...", "As an AI..."
- NEVER say you are text-based or cannot hear audio
- Do NOT repeat the same sentence twice
- Keep answers SHORT (1-3 sentences max for voice)
- Answer directly, then ONE follow-up question if needed
- No lengthy introductions or greetings unless asked
- Be conversational and natural - like a real mentor, not a chatbot
- If user says "testing" or "can you hear me", respond briefly: "Yes, I can hear you. What's on your mind?"
- If the user says "stop", "hold on", or "you didn't hear me" -> apologize briefly + ask them to repeat the key question in one sentence.

NAME & SPEECH HANDLING (CRITICAL):
- You often mishear "Durmah" as "Denmark", "Dharma", "Darma", "Durma", "Derma", "Doormah", or "Duma". ALWAYS interpret these as "Durmah".
- NEVER guess the user's name from speech transcription.
- Use neutral address ("you") unless the name is explicitly provided in the STUDENT context or Identity.
- If you hear "Hi Denmark", interpret it as "Hi Durmah".

CLARIFICATION LOOP:
- If the user message is about app testing, UX, build status, or is NOT clearly a legal/study question:
  - Acknowledgement + Clarification Question.
  - Example: "Got it — you're testing the app. What would you like me to do: review behavior, explain a feature, or help plan?"
- Do NOT pivot to legal topics if the user is discussing technical/app issues.`;
}

/**
 * Builds a compact CONTEXT BLOCK with current student situation
 * This gets injected as part of the conversation context
 * CRITICAL: Uses academic.now for TIMEZONE TRUTH - never compute dates locally
 */
export function buildDurmahContextBlock(context: StudentContext): string {
  const student = context?.student ?? null;
  const assignments = context?.assignments ?? { total: 0, upcoming: [], overdue: [], recentlyCreated: [] };
  const schedule = context?.schedule ?? { todaysClasses: [] };
  const academic = context?.academic ?? null;
  
  // TIMEZONE TRUTH: Use academic.now if available, else fallback
  const academicNow = academic?.now ?? null;
  const localISO = academicNow?.localTimeISO ?? student?.localTimeISO ?? new Date().toISOString();
  
  const nowText = academicNow?.nowText || new Date(localISO).toLocaleString('en-GB', { timeZone: 'Europe/London' });
  const todayKey = academicNow?.dayKey || localISO.substring(0, 10);
  
  const displayName = student?.displayName ?? 'Student';
  const yearGroup = student?.yearGroup ?? 'Unknown Year';
  const term = student?.term ?? 'Unknown Term';
  const weekOfTerm = student?.weekOfTerm ?? '?';

  // Keep context block COMPACT for voice mode
  let block = `NOW: ${nowText}
STUDENT: ${displayName}, ${yearGroup}, ${term} Week ${weekOfTerm}

`;

  // CURRENT LECTURE CONTEXT (Central Intelligence Injection)
  if (context.lectures?.current) {
    const l = context.lectures.current;
    if (l) {
        block += `\nCurrently Viewing / Active Lecture: "${l.title}" (${l.module_name || 'Unknown Module'})\n`;
        if (l.summary) block += `Summary: ${l.summary.substring(0, 300)}...\n`;
        if (l.transcript_snippet) block += `Raw Transcript Snippet: "${l.transcript_snippet.substring(0, 500)}..."\n[Full context available to referencing]\n`;
        if (l.key_points && l.key_points.length > 0) block += `Key Points: ${l.key_points.slice(0, 3).join('; ')}\n`;
        if (l.engagement_hooks && l.engagement_hooks.length > 0) block += `Discussion Hooks: ${l.engagement_hooks.slice(0, 2).join('; ')}\n`;
        block += `\nYou can refer to this lecture content directly in your conversation.\n\n`;
    }
  }

  // Upcoming deadlines
  if (assignments?.upcoming?.length > 0) {
    block += `UPCOMING DEADLINES:\n`;
    assignments.upcoming.forEach((a) => {
      block += `- "${a.title}" (${a.module}) - ${a.daysLeft} day${a.daysLeft === 1 ? '' : 's'} left\n`;
    });
  } else {
    block += `UPCOMING DEADLINES: None in next 7 days\n`;
  }

  // Overdue (RED FLAG)
  if (assignments?.overdue?.length > 0) {
    block += `\n⚠️ OVERDUE:\n`;
    assignments.overdue.forEach((a) => {
      block += `- "${a.title}" (${a.module}) - ${a.daysOver} day${a.daysOver === 1 ? '' : 's'} overdue\n`;
    });
  }

  // Recently created
  if (assignments?.recentlyCreated?.length > 0) {
    block += `\nRECENTLY ADDED:\n`;
    assignments.recentlyCreated.slice(0, 3).forEach((a) => {
      block += `- "${a.title}" (${a.module})\n`;
    });
  }

  // Today's schedule
  if (schedule?.todaysClasses?.length > 0) {
    block += `\nTODAY'S SCHEDULE:\n`;
    schedule.todaysClasses.forEach((c) => {
      block += `- ${c.module_name} at ${c.time}\n`;
    });
  } else {
    block += `\nTODAY'S SCHEDULE: No classes\n`;
  }

  // YAAG CALENDAR (CENTRAL INTELLIGENCE!)
  if (context.yaag?.itemsByDay) {
    const dates = Object.keys(context.yaag.itemsByDay).sort();
    block += `\n\n📅 CALENDAR DATA (${context.yaag.rangeStart} to ${context.yaag.rangeEnd}):\n`;
    block += `Available dates: ${dates.length} days\n`;
    block += `\nHOW TO USE THIS DATA:\n`;
    block += `- When asked "What's on [DATE]?" → look up itemsByDay["YYYY-MM-DD"]\n`;
    block += `- When asked "What classes this week?" → iterate through dates\n`;
    block += `- Event types: plan (lectures), personal (student tasks), assignment (deadlines), timetable (scheduled)\n`;
    block += `- NEVER guess or hallucinate schedule - ONLY use itemsByDay\n`;
    
    // Sample a few days to show format
    const sampleDates = dates.slice(0, 3);
    if (sampleDates.length > 0) {
      block += `\nEXAMPLE DAYS:\n`;
      sampleDates.forEach(date => {
        const items = context.yaag!.itemsByDay[date];
        if (items && items.length > 0) {
          block += `${date}: ${items.length} event${items.length === 1 ? '' : 's'} (${items.map(i => i.title.substring(0, 20)).join(', ')})\n`;
        } else {
          block += `${date}: No events\n`;
        }
      });
    }
  }

  // LECTURES: Metadata only - content fetched on demand via tool
  if (context.lectures?.recent && context.lectures.recent.length > 0) {
    block += `\n\n🎓 MY LECTURES (${context.lectures.recent.length} available):\n`;
    context.lectures.recent.slice(0, 5).forEach((l: any) => {
      block += `- [${l.id}] "${l.title}" (${l.module_code || l.module_name || 'Lecture'})${l.lecture_date ? ` - ${l.lecture_date}` : ''}\n`;
    });
    block += `\nTo discuss a specific lecture, use get_lecture_details(lectureId) to fetch its content.`;
  }

  // RECENT MEMORIES (Conversation Continuity)
  if (context.recentMemories && context.recentMemories.length > 0) {
    block += `\n\n🧠 RECENT MEMORIES (Last ${context.recentMemories.length} interactions):\n`;
    context.recentMemories.forEach((m) => {
        const role = m.role === 'user' ? 'Student' : 'Durmah';
        const snippet = m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content;
        block += `- ${role}: "${snippet}"\n`;
    });
    block += `\nUse these memories to maintain conversation continuity. If the user refers to "what I just said" or "that lecture", look here first.`;
  }

  block += `\nTotal assignments: ${assignments.total}`;

  return block;
}

/**
 * Generates a proactive greeting ONLY IF there's something urgent
 * Returns null if nothing urgent
 */
export function generateProactiveGreeting(context: StudentContext): string | null {
  const { assignments } = context;

  // Priority 1: Overdue assignments
  if (assignments.overdue.length > 0) {
    const first = assignments.overdue[0];
    if (first) {
      return `Hey! I noticed you have an overdue assignment: "${first.title}" (${first.module}). It was due ${first.daysOver} day${first.daysOver === 1 ? '' : 's'} ago. Want some help getting it finished?`;
    }
  }

  // Priority 2: Urgent deadlines (< 3 days)
  const urgent = assignments.upcoming.filter((a) => a.daysLeft !== null && a.daysLeft <= 3);
  if (urgent.length > 0) {
    const first = urgent[0];
    if (first && first.daysLeft !== null) {
      return `Hey! Quick heads-up - your "${first.title}" assignment is due in ${first.daysLeft} day${first.daysLeft === 1 ? '' : 's'}. Need any help with it?`;
    }
  }

  // Priority 3: Recently created assignments
  if (assignments.recentlyCreated.length > 0) {
    const first = assignments.recentlyCreated[0];
    if (first) {
      return `I see you just added "${first.title}"! Want to plan it out together?`;
    }
  }

  return null; // Regular conversational opening
}

