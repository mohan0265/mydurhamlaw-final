// File: /src/lib/prompts/MemoryManagerAgent/prompt.ts

interface DurhamContext {
  academicYear?: 1 | 2 | 3;
  currentWeek?: number;
  modules?: string[];
  delsa_progress?: number;
  mooting_interest?: boolean;
  pro_bono_interest?: boolean;
}

export const buildMemoryAwarePrompt = (
  memoryNotes: string[],
  userQuestion: string,
  durhamContext?: DurhamContext
): string => {
  const formattedMemories = memoryNotes
    .map((note, index) => `• ${note}`)
    .join('\n');

  const currentDate = new Date();
  const termStart2025 = new Date('2025-10-06'); // Michaelmas Term 2025 starts Oct 6
  const termEnd2025 = new Date('2025-12-12');   // Ends Dec 12
  const weekNumber = Math.floor(
    (currentDate.getTime() - termStart2025.getTime()) / (1000 * 60 * 60 * 24 * 7)
  ) + 1;
  const isInTerm2025 = currentDate >= termStart2025 && currentDate <= termEnd2025;

  const termContext = isInTerm2025
    ? `We are currently in Week ${Math.max(1, Math.min(10, weekNumber))} of 10 in Michaelmas Term 2025.`
    : currentDate < termStart2025
    ? `Michaelmas Term 2025 starts on October 6. We are in the pre-term preparation period.`
    : `Michaelmas Term 2025 has ended (Dec 12). We are in the exam/vacation period.`;

  const yearSpecificContext = getYearSpecificContext(durhamContext?.academicYear || 1);
  const moduleContext = durhamContext?.modules?.length
    ? `Current modules: ${durhamContext.modules.join(', ')}`
    : '';
  const delsaContext = durhamContext?.delsa_progress != null
    ? `DELSA Progress: ${durhamContext.delsa_progress}%`
    : '';
  const mootingContext = durhamContext?.mooting_interest ? `Interested in mooting.` : '';
  const proBonoContext = durhamContext?.pro_bono_interest ? `Interested in pro bono work.` : '';

  return `
You are an empathetic, knowledgeable AI assistant specifically designed for Durham University Law students. You have deep knowledge of:
- UK legal system, case law, and Durham-specific curriculum
- Student wellbeing resources and academic support services
- Practical pathways like DELSA, mooting, pro bono, internships

${termContext}
${yearSpecificContext}
${moduleContext}
${delsaContext}
${mootingContext}
${proBonoContext}

The student has asked:
"${userQuestion}"

Here is their memory log:
${formattedMemories}

Please provide a helpful, context-aware response.`.trim();
};

function getYearSpecificContext(year: 1 | 2 | 3): string {
  switch (year) {
    case 1:
      return `1st Year Student – Focus on foundational legal concepts, develop strong habits.`;
    case 2:
      return `2nd Year Student – Building on foundations with complex areas and career prep.`;
    case 3:
      return `Final Year Student – Dissertation writing and advanced modules. Stay focused.`;
    default:
      return '';
  }
}
