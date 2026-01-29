export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: string[];
  readTime: string;
  publishedAt: string;
  href: string;
  canonicalPath: string;
  featured?: boolean;
  order: number;
  type: "article" | "demo" | "pillar";
  tags?: string[];
}

export const guides: Guide[] = [
  {
    slug: "does-your-child-need-tutor-uk-guide",
    href: "/does-your-child-need-tutor-uk-guide",
    canonicalPath: "https://casewaylaw.ai/does-your-child-need-tutor-uk-guide",
    title: "Does Your Child Need a Tutor? UK Parent Guide",
    description:
      "Real tutoring costs (£25–£50/hr), warning signs, and evidence-based alternatives for UK parents.",
    category: ["Study Skills", "Psychology"],
    readTime: "8 min read",
    publishedAt: "2026-01-29",
    order: 0, // Top priority
    type: "pillar",
    tags: ["parents", "tutoring", "costs", "study-skills"],
  },
  {
    slug: "no-question-is-a-stupid-question",
    href: "/articles/no-question-is-a-stupid-question",
    canonicalPath:
      "https://casewaylaw.ai/articles/no-question-is-a-stupid-question",
    title: "No Question Is a Stupid Question",
    description:
      "Why fear stops students from learning — and how judgement-free questioning builds confidence.",
    category: ["Psychology"],
    readTime: "8 min read",
    publishedAt: "2026-01-27",
    featured: true,
    order: 1,
    type: "article",
    tags: ["questioning", "confidence", "legal-skills", "study-techniques"],
  },
  {
    slug: "durham-law-ai-study-assistant",
    href: "/learn/durham-law-ai-study-assistant",
    canonicalPath: "https://casewaylaw.ai/learn/durham-law-ai-study-assistant",
    title: "AI Study Assistant",
    description:
      "Master Durmah features for ethical case research, IRAC issue spotting, and exam prep. Optimized for the Durham syllabus.",
    category: ["Study Skills"],
    readTime: "12 min read",
    publishedAt: "2025-12-15",
    order: 2,
    type: "article",
  },
  {
    slug: "durham-law-academic-integrity-ai",
    href: "/learn/durham-law-academic-integrity-ai",
    canonicalPath:
      "https://casewaylaw.ai/learn/durham-law-academic-integrity-ai",
    title: "Academic Integrity & AI Use",
    description:
      "Understand the boundaries of AI use. What's permitted, prohibited, and how to stay compliant with University standards.",
    category: ["Ethics"],
    readTime: "10 min read",
    publishedAt: "2025-11-20",
    order: 3,
    type: "article",
  },
  {
    slug: "how-to-ask-better-legal-questions",
    href: "/learn/how-to-ask-better-legal-questions",
    canonicalPath:
      "https://casewaylaw.ai/learn/how-to-ask-better-legal-questions",
    title: "How to Ask Better Legal Questions",
    description:
      "Frame precise analytical questions for tutorials, Durmah, and research. The 4-layer framework.",
    category: ["Speaking"],
    readTime: "8 min read",
    publishedAt: "2025-11-10",
    order: 4,
    type: "article",
    tags: ["questioning", "confidence", "legal-skills", "study-techniques"],
  },
  {
    slug: "durham-law-exam-technique",
    href: "/learn/durham-law-exam-technique",
    canonicalPath: "https://casewaylaw.ai/learn/durham-law-exam-technique",
    title: "Law Exam Technique",
    description:
      "Master problem questions with IRAC, structure essays, and manage time like a pro. Tailored for Durham exam formats.",
    category: ["Exam Prep"],
    readTime: "11 min read",
    publishedAt: "2025-11-05",
    order: 5,
    type: "article",
  },
  {
    slug: "stay-current",
    href: "/stay-current",
    canonicalPath: "https://casewaylaw.ai/stay-current",
    title: "Stay Current: Legal News habit",
    description:
      "Build commercial awareness with our live legal news feed, tailored for Durham Law students.",
    category: ["News"],
    readTime: "5 min read",
    publishedAt: "2025-10-30",
    order: 6,
    type: "article",
  },
  {
    slug: "learn-write-speak-law",
    href: "/learn/learn-write-speak-law",
    canonicalPath: "https://casewaylaw.ai/learn/learn-write-speak-law",
    title: "Learn law. Write law. Speak law.",
    description:
      "Understand the three pillars of legal mastery. Why legal writing is only half the battle.",
    category: ["Writing", "Speaking"],
    readTime: "10 min read",
    publishedAt: "2025-10-25",
    order: 7,
    type: "article",
  },
  {
    slug: "quiz-me",
    href: "/articles/quiz-me",
    canonicalPath: "https://casewaylaw.ai/articles/quiz-me",
    title: "Quiz Me: The Active Recall System",
    description:
      "How to use oral prompts and spaced repetition to build long-term memory for legal doctrines.",
    category: ["Speaking", "Study Skills"],
    readTime: "9 min read",
    publishedAt: "2026-01-27",
    order: 8,
    type: "article",
    tags: ["speak-law", "practice", "viva", "confidence"],
  },
  {
    slug: "speak-law",
    href: "/speak-law",
    canonicalPath: "https://casewaylaw.ai/speak-law",
    title: "Speak Law: Mastering Oral Reasoning",
    description:
      "The pillar of legal mastery. How to build oral reasoning step-by-step for seminars and vivas.",
    category: ["Speaking"],
    readTime: "12 min read",
    publishedAt: "2026-01-27",
    order: 9,
    type: "pillar",
    tags: ["speak-law", "oral-reasoning", "confidence"],
  },
  // PRODUCT DEMOS
  {
    slug: "year-at-a-glance",
    href: "/demo/year-at-a-glance",
    canonicalPath: "https://casewaylaw.ai/demo/year-at-a-glance",
    title: "Year At A Glance (Demo)",
    description:
      "Interactive visual roadmap of your academic year, Michaelmas to graduation.",
    category: ["Study Skills"],
    readTime: "3 min demo",
    publishedAt: "2026-01-27",
    order: 10,
    type: "demo",
  },
  {
    slug: "assignments",
    href: "/demo/assignments",
    canonicalPath: "https://casewaylaw.ai/demo/assignments",
    title: "Assignment Support (Demo)",
    description:
      "Step-by-step drafting workflow from issue spotting to final analytical polish.",
    category: ["Writing"],
    readTime: "3 min demo",
    publishedAt: "2026-01-27",
    order: 11,
    type: "demo",
  },
  {
    slug: "durmah-voice-demo",
    href: "/demo/durmah-voice",
    canonicalPath: "https://casewaylaw.ai/demo/durmah-voice",
    title: "Durmah Voice Buddy (Demo)",
    description:
      "Talk to your AI legal eagle buddy. Instant clarification without judgement.",
    category: ["Speaking", "Psychology"],
    readTime: "2 min demo",
    publishedAt: "2026-01-27",
    order: 12,
    type: "demo",
    tags: ["speak-law", "voice", "practice", "confidence"],
  },
  {
    slug: "quiz-me-demo",
    href: "/demo/quiz-me",
    canonicalPath: "https://casewaylaw.ai/demo/quiz-me",
    title: "Quiz Me (Demo)",
    description:
      "Interactive active recall session. Test your memory with AI-generated oral prompts.",
    category: ["Speaking", "Study Skills"],
    readTime: "3 min demo",
    publishedAt: "2026-01-27",
    order: 15,
    type: "demo",
    tags: ["speak-law", "practice", "viva", "confidence"],
  },
  {
    slug: "exam-prep-demo",
    href: "/demo/exam-prep",
    canonicalPath: "https://casewaylaw.ai/demo/exam-prep",
    title: "Exam Technique (Demo)",
    description:
      "Master IRAC and essay structuring with guided AI prep sessions.",
    category: ["Exam Prep"],
    readTime: "4 min demo",
    publishedAt: "2026-01-27",
    order: 13,
    type: "demo",
  },
  {
    slug: "my-lectures-demo",
    href: "/demo/my-lectures",
    canonicalPath: "https://casewaylaw.ai/demo/my-lectures",
    title: "My Lectures & Notes (Demo)",
    description:
      "Syllabus-aligned tracking and organization for every lecture and tutorial.",
    category: ["Study Skills"],
    readTime: "2 min demo",
    publishedAt: "2026-01-27",
    order: 14,
    type: "demo",
  },
];
