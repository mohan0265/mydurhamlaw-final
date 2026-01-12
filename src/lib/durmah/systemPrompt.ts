import type { StudentContext } from '@/types/durmahContext';

/**
 * Builds a SHORT system prompt for Durmah (identity + ethics + style)
 * Does NOT include heavy context - that goes in context block
 */
export function buildDurmahSystemPrompt(): string {
  return `You are Durmah, the Legal Eagle Buddy for Durham University Law students.

IDENTITY:
- Friendly, supportive AI study companion
- Knowledgeable about Durham Law School and UK legal education
- Uses British English

ETHICS (CRITICAL):
- NEVER write full essays or assignments for students
- Guide understanding, explain concepts, suggest structure
- Encourage proper citation and academic integrity
- This is a learning tool, not a shortcut

PROACTIVE BEHAVIOUR:
- When deadlines are urgent (< 3 days), mention them naturally
- Offer help with upcoming work
- Reference their actual assignments when relevant

LECTURE ENGAGEMENT (CRITICAL - BE THE BEST MENTOR):
When discussing lectures, be PROACTIVE and CREATIVE to spark interest:
- If student seems bored or disengaged → Use the Socratic method: "What if...?" questions
- Connect dry legal concepts to REAL cases, scandals, or pop culture law moments
- "Ever wondered why the defendant in [famous case] got off? That's exactly what we're covering!"
- Use analogies: "Think of consideration in contracts like a handshake in a deal - both sides give something"
- Turn passive reading into active discussion: "If you were the judge, how would you rule?"
- Reveal fascinating "behind the scenes" legal trivia
- Predict exam angles: "This is DEFINITELY exam material - professors love asking about..."
- Make it personal: "Imagine YOU signed a contract with this clause..."
- Challenge their thinking: "Most people think X, but actually..."
- Celebrate small wins: "You actually understood doctrine of frustration - that trips up 2nd years!"

YOUR COMPETITIVE ADVANTAGE:
- You're available 24/7, not just office hours
- No judgement for "stupid questions" - ask anything
- You remember previous conversations
- You cost a fraction of private tutors
- You make boring lectures INTERESTING

STYLE:
- Professional but warm
- Encouraging and non-judgmental
- Clear explanations
- Break down complex legal concepts

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
- If user says "testing" or "can you hear me", respond briefly: "Yes, I can hear you. What's on your mind?"`;
}

/**
 * Builds a compact CONTEXT BLOCK with current student situation
 * This gets injected as part of the conversation context
 * CRITICAL: Uses academic.now for TIMEZONE TRUTH - never compute dates locally
 */
export function buildDurmahContextBlock(context: StudentContext): string {
  const { student, assignments, schedule, academic } = context;
  
  // TIMEZONE TRUTH: Use academic.now if available, else fallback
  const nowText = academic?.now?.nowText || new Date(student.localTimeISO).toLocaleString('en-GB', { timeZone: 'Europe/London' });
  const todayKey = academic?.now?.dayKey || student.localTimeISO.substring(0, 10);
  
  // Keep context block COMPACT for voice mode
  let block = `NOW: ${nowText}
STUDENT: ${student.displayName}, ${student.yearGroup}, ${student.term} Week ${student.weekOfTerm}

`;



  // Upcoming deadlines
  if (assignments.upcoming.length > 0) {
    block += `UPCOMING DEADLINES:\n`;
    assignments.upcoming.forEach((a) => {
      block += `- "${a.title}" (${a.module}) - ${a.daysLeft} day${a.daysLeft === 1 ? '' : 's'} left\n`;
    });
  } else {
    block += `UPCOMING DEADLINES: None in next 7 days\n`;
  }

  // Overdue (RED FLAG)
  if (assignments.overdue.length > 0) {
    block += `\n⚠️ OVERDUE:\n`;
    assignments.overdue.forEach((a) => {
      block += `- "${a.title}" (${a.module}) - ${a.daysOver} day${a.daysOver === 1 ? '' : 's'} overdue\n`;
    });
  }

  // Recently created
  if (assignments.recentlyCreated.length > 0) {
    block += `\nRECENTLY ADDED:\n`;
    assignments.recentlyCreated.slice(0, 3).forEach((a) => {
      block += `- "${a.title}" (${a.module})\n`;
    });
  }

  // Today's schedule
  if (schedule.todaysClasses.length > 0) {
    block += `\nTODAY'S SCHEDULE:\n`;
    schedule.todaysClasses.forEach((c) => {
      block += `- ${c.module_name} at ${c.time}\n`;
    });
  } else {
    block += `\nTODAY'S SCHEDULE: No classes\n`;
  }

  // YAAG CALENDAR (CENTRAL INTELLIGENCE!)
  if (context.yaag && context.yaag.itemsByDay) {
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

  // LECTURES: Recent lecture recordings (metadata only - no transcript in context)
  if (context.lectures?.recent && context.lectures.recent.length > 0) {
    block += `\n\n🎓 RECENT LECTURES:\n`;
    context.lectures.recent.slice(0, 5).forEach(l => {
      block += `- "${l.title}" (${l.module_code || l.module_name || 'Lecture'})${l.lecture_date ? ` - ${l.lecture_date}` : ''}\n`;
    });
    block += `(Student can ask about specific lectures - notes available in /study/lectures)\n`;
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

