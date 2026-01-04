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

STYLE:
- Professional but warm
- Encouraging and non-judgmental
- Clear explanations
- Break down complex legal concepts`;
}

/**
 * Builds a compact CONTEXT BLOCK with current student situation
 * This gets injected as part of the conversation context
 */
export function buildDurmahContextBlock(context: StudentContext): string {
  const { student, assignments, schedule } = context;
  
  let block = `CURRENT CONTEXT (${new Date(student.localTimeISO).toLocaleDateString('en-GB')}):
Student: ${student.displayName}, ${student.yearGroup}
Term: ${student.term}, Week ${student.weekOfTerm}

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
    return `Hey! I noticed you have an overdue assignment: "${first.title}" (${first.module}). It was due ${first.daysOver} day${first.daysOver === 1 ? '' : 's'} ago. Want some help getting it finished?`;
  }

  // Priority 2: Urgent deadlines (< 3 days)
  const urgent = assignments.upcoming.filter((a) => a.daysLeft <= 3);
  if (urgent.length > 0) {
    const first = urgent[0];
    return `Hey! Quick heads-up - your "${first.title}" assignment is due in ${first.daysLeft} day${first.daysLeft === 1 ? '' : 's'}. Need any help with it?`;
  }

  // Priority 3: Recently created assignments
  if (assignments.recentlyCreated.length > 0) {
    const first = assignments.recentlyCreated[0];
    return `I see you just added "${first.title}"! Want to plan it out together?`;
  }

  return null; // Regular conversational opening
}
