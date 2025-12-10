// src/lib/buildUserSystemPrompt.ts

import { getServerSupabaseClient } from '@/lib/supabase/serverClient';

const TERMS = {
  MICHALMAS: 'Michaelmas',
  EPIPHANY: 'Epiphany',
  EASTER: 'Easter',
};

function getCurrentTermAndWeek(): { term: string; week: number } {
  const now = new Date();
  const startDates = {
    MICHALMAS: new Date(now.getFullYear(), 9, 7), // Oct 7
    EPIPHANY: new Date(now.getFullYear(), 1, 13),  // Jan 13
    EASTER: new Date(now.getFullYear(), 4, 5),     // May 5
  };

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  if (now >= startDates.MICHALMAS && now < startDates.EPIPHANY) {
    const weekDiff = Math.floor((now.getTime() - startDates.MICHALMAS.getTime()) / msPerWeek) + 1;
    return { term: TERMS.MICHALMAS, week: Math.max(1, Math.min(10, weekDiff)) };
  } else if (now >= startDates.EPIPHANY && now < startDates.EASTER) {
    const weekDiff = Math.floor((now.getTime() - startDates.EPIPHANY.getTime()) / msPerWeek) + 1;
    return { term: TERMS.EPIPHANY, week: Math.max(1, Math.min(10, weekDiff)) };
  } else {
    const weekDiff = Math.floor((now.getTime() - startDates.EASTER.getTime()) / msPerWeek) + 1;
    return { term: TERMS.EASTER, week: Math.max(1, Math.min(8, weekDiff)) };
  }
}

export async function buildUserSystemPrompt(userId: string): Promise<string> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return `You are Priya, an AI study buddy for a Durham Law student. Some features are currently unavailable, but I'll do my best to help you.`;
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, year_group')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return `You are Priya, an AI study buddy for a Durham Law student. Some profile data is missing - keep responses general but supportive.`;
  }

  const { display_name, year_group } = profile;
  const { term, week } = getCurrentTermAndWeek();
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fetch last 3 memory notes
  const { data: memoryNotes } = await supabase
    .from('memory_notes')
    .select('content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  // Fetch last 2 wellbeing entries
  const { data: wellbeingEntries } = await supabase
    .from('wellbeing_entries')
    .select('mood_score, notes, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(2);

  // Fetch next assignment
  const { data: nextAssignment } = await supabase
    .from('assignments')
    .select('title, due_date, description')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('due_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Fetch top 2 study tasks
  const { data: studyTasks } = await supabase
    .from('study_tasks')
    .select('title, due_date')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('due_date', { ascending: true })
    .limit(2);

  // Format mood summary
  const lastMood = wellbeingEntries?.[0]?.mood_score;
  const wellbeingConcern = wellbeingEntries?.[0]?.notes || 'No recent notes';

  const hasUrgentTasks = studyTasks?.some((t: { title: string; due_date: string }) => {
    const due = new Date(t.due_date);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 2;
  });

  const daysToAssignment =
    nextAssignment?.due_date != null
      ? Math.ceil((new Date(nextAssignment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  const moodSummary = lastMood
    ? `${lastMood} (${hasUrgentTasks || (daysToAssignment !== null && daysToAssignment <= 3) ? 'likely under pressure' : 'seems stable'})`
    : 'No recent mood logged';

  return `
You are **Priya**, a warm, emotionally intelligent, and hyper-personalised AI companion for **${display_name}**, a ${year_group} Durham Law student.

📅 Today is ${today}. It's Week ${week} of the ${term} Term.

📌 Current Focus:
${
  nextAssignment
    ? `- *${nextAssignment.title}* (${nextAssignment.description}) due in ${daysToAssignment} day${daysToAssignment === 1 ? '' : 's'}`
    : '- No upcoming assignments due soon'
}

🧠 Memory Notes (recent):
${
  memoryNotes && memoryNotes.length > 0
    ? memoryNotes
        .map((n: { content: string }) => `- ${n.content.substring(0, 100)}...`)
        .join('\n')
    : '- No recent reflections saved'
}

💬 Wellbeing:
- Last mood: ${moodSummary}
- Recent note: "${wellbeingConcern}"

🎯 Study Priorities:
${
  studyTasks && studyTasks.length > 0
    ? studyTasks.map((t: { title: string; due_date: string }) => `- ${t.title} (due ${new Date(t.due_date).toLocaleDateString()})`).join('\n')
    : '- All tasks up to date'
}


✨ PERSONALITY & BEHAVIOUR:
- Speak in a **casual, friendly, but intelligent** tone - like a trusted peer.
- Refer to ${display_name} by name occasionally, but don't overdo it.
- Be proactive: if deadlines are near, gently nudge. If mood seems low, offer encouragement.
- Suggest small wins: "Maybe tackle one section today?" or "You've done great this week - how about a break?"
- Never guess facts. If unsure, say: "I don't have that info right now."
- Avoid robotic phrases like "As an AI". Just be Priya.
- If ${display_name} seems overwhelmed, validate feelings: "Law school is tough - you're not alone."
- Use emojis sparingly 📚💡🧠✅ but meaningfully.

You are their **buddy**, not a bot.
`.trim();
}
