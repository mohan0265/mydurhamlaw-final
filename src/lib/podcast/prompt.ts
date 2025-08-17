// src/lib/podcast/prompt.ts

interface UserProfile {
  id: string
  full_name?: string
  user_type?: string
  email?: string
}

interface UserContext {
  profile: UserProfile | null
  currentYear: string
  todayDate: string
  modules?: string[]
  assignments?: Array<{
    title: string
    dueDate: string
    subject: string
  }>
  upcomingEvents?: Array<{
    title: string
    date: string
    type: string
  }>
}

export function buildPodcastPrompt(
  slot: 'pre' | 'post',
  userContext: UserContext
): string {
  const { profile, currentYear, todayDate, modules = [], assignments = [], upcomingEvents = [] } = userContext
  
  const userName = profile?.full_name?.split(' ')[0] || 'Student'
  const timeOfDay = slot === 'pre' ? 'morning' : 'evening'
  const greeting = slot === 'pre' 
    ? `Good morning, ${userName}! Ready to tackle another day at Durham Law?`
    : `Good evening, ${userName}! Time to reflect on your law studies today.`

  // Build contextual content based on user data
  const modulesList = modules.length > 0 
    ? `Your current modules include: ${modules.join(', ')}.`
    : `You're progressing through your ${currentYear} curriculum.`

  const assignmentReminders = assignments.length > 0
    ? `\n\nUpcoming assignments to keep in mind:\n${assignments.map(a => 
        `• ${a.title} (${a.subject}) - due ${a.dueDate}`
      ).join('\n')}`
    : ''

  const eventsReminders = upcomingEvents.length > 0
    ? `\n\nDurham events coming up:\n${upcomingEvents.map(e => 
        `• ${e.title} on ${e.date}`
      ).join('\n')}`
    : ''

  // Wellbeing nudges and humor
  const wellbeingTips = [
    "Remember to take breaks between study sessions - your brain needs time to process complex legal concepts!",
    "Don't forget to stay hydrated and grab some fresh air between lectures.",
    "Connect with your Durham Law community - you're all in this together!",
    "Take a moment to appreciate how much you've learned since starting your law journey.",
    "Remember that even the greatest barristers started exactly where you are now."
  ]

  const lightHumor = [
    "They say lawyers love Latin phrases... but honestly, res ipsa loquitur - the thing speaks for itself! 📚",
    "Fun fact: The UK Supreme Court building has 11 floors - that's one for each Justice, plus room for all those law books! 🏛️",
    "Remember, even Judge Judy started as a law student once. You've got this! ⚖️",
    "Legal studies tip: If you can explain it to a rubber duck, you probably understand it well enough for the exam! 🦆",
    "Durham fact: The cathedral has been standing for over 900 years - that's a lot of legal precedent to catch up on! 🏰"
  ]

  const randomWellbeing = wellbeingTips[Math.floor(Math.random() * wellbeingTips.length)]
  const randomHumor = lightHumor[Math.floor(Math.random() * lightHumor.length)]

  // Time-specific content
  const timeSpecificContent = slot === 'pre' 
    ? `As you start this ${todayDate}, here are some gentle reminders for your law studies:`
    : `As you wind down this ${todayDate}, let's reflect on your law studies:`

  const actionItems = slot === 'pre'
    ? [
        "Review your lecture notes from yesterday - active recall strengthens legal reasoning",
        "Set three specific study goals for today",
        "Check your Durham student portal for any updates",
        "Take 5 minutes to organize your study space"
      ]
    : [
        "Reflect on what legal concepts you learned today",
        "Note any questions that came up during lectures or reading",
        "Prepare your materials for tomorrow's sessions", 
        "Take a moment to appreciate your progress"
      ]

  const prompt = `
You are creating a personalized daily podcast for ${userName}, a Durham University Law student in their ${currentYear}. 

Generate a warm, conversational, and encouraging ${timeOfDay} podcast script that is exactly 90-120 seconds when spoken aloud. The tone should be friendly, supportive, and occasionally humorous - like a knowledgeable study buddy.

${greeting}

${timeSpecificContent}

${modulesList}${assignmentReminders}${eventsReminders}

Key elements to include:
1. Brief motivational opening (${timeOfDay} greeting)
2. 2-3 specific, actionable study tips relevant to law students
3. One Durham University or legal profession fact/insight
4. Gentle wellbeing reminder
5. Light humor appropriate for law students
6. Encouraging closing

Focus on:
- Practical study strategies for legal subjects
- Durham-specific references when possible
- Academic integrity and ethical legal practice
- Building confidence and resilience
- Creating sustainable study habits

Wellbeing focus: ${randomWellbeing}
Light humor: ${randomHumor}

Action-oriented suggestions:
${actionItems.map(item => `• ${item}`).join('\n')}

Keep the script conversational and personal, as if speaking directly to ${userName}. Avoid being preachy or overly academic. The goal is to motivate, inform, and support their law school journey while maintaining a warm, human connection.

End with an encouraging message about their potential and progress at Durham Law.

Write the complete script now, keeping it between 90-120 seconds of natural speech:
`.trim()

  return prompt
}

export function generatePodcastTitle(slot: 'pre' | 'post', userName: string, date: string): string {
  const timeLabel = slot === 'pre' ? 'Morning' : 'Evening'
  const dateFormatted = new Date(date).toLocaleDateString('en-GB', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  
  return `${timeLabel} Law Briefing - ${dateFormatted} | ${userName}'s Durham Journey`
}

export function validatePodcastScript(script: string): { 
  isValid: boolean
  wordCount: number
  estimatedDuration: number
  issues: string[]
} {
  const wordCount = script.split(/\s+/).length
  const estimatedDuration = Math.round((wordCount / 150) * 60) // Assuming 150 words per minute
  const issues: string[] = []

  if (wordCount < 135) {
    issues.push('Script may be too short (under 90 seconds)')
  }
  if (wordCount > 200) {
    issues.push('Script may be too long (over 120 seconds)')
  }
  if (!script.toLowerCase().includes('durham')) {
    issues.push('Script should include Durham University references')
  }
  if (script.length < 200) {
    issues.push('Script content seems insufficient')
  }

  return {
    isValid: issues.length === 0,
    wordCount,
    estimatedDuration,
    issues
  }
}