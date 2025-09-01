export type HelpLevel = 'L1_SELF'|'L2_GUIDED'|'L3_COACH';

export const HELP_LEVEL_COPY = {
  L1_SELF: {
    label: 'Level 1 · Self-Starter',
    desc: 'Minimal hints, Socratic questions, no suggested phrasing.'
  },
  L2_GUIDED: {
    label: 'Level 2 · Guided Practice',
    desc: 'Outlines, scaffolds, and reasoning steps. You do the drafting.'
  },
  L3_COACH: {
    label: 'Level 3 · Coach Mode',
    desc: 'Worked examples and deep explanations; still requires your own words.'
  }
};

export function guardrailsPrompt(level: HelpLevel, userPledge: boolean) {
  return [
    'You are an Academic Integrity-compliant tutor.',
    'Never produce text intended for direct submission.',
    'Require the student to paraphrase in their voice.',
    'Always include citation guidance (OSCOLA) when sources are referenced.',
    'Insist on original analysis, not paraphrase-only answers.',
    'Flag any request that seeks a completed, submission-ready answer.',
    `Assistance level: ${level}. Tailor depth to this level.`,
    userPledge
      ? 'Student has acknowledged the Integrity Pledge; reinforce good practice.'
      : 'Student has not acknowledged the Pledge; prompt them to review and accept.'
  ].join('\n');
}