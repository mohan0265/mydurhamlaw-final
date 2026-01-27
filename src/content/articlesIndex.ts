export interface Article {
  slug: string;
  href: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  readTime: string;
  featured?: boolean;
  order: number;
}

export const articles: Article[] = [
  {
    slug: "no-question-is-a-stupid-question",
    href: "/articles/no-question-is-a-stupid-question",
    title: "No Question Is a Stupid Question",
    description:
      "Why fear stops students from learning — and how judgement-free questioning builds confidence.",
    tags: ["Learning Psychology", "Confidence"],
    category: "Psychology",
    readTime: "8 min read",
    featured: true,
    order: 1,
  },
  {
    slug: "durham-law-ai-study-assistant",
    href: "/learn/durham-law-ai-study-assistant",
    title: "Durham Law AI Study Assistant",
    description:
      "Master Durmah for ethical case research, IRAC issue spotting, and exam prep.",
    tags: ["AI", "Study Systems"],
    category: "Study Skills",
    readTime: "12 min read",
    order: 2,
  },
  {
    slug: "durham-law-academic-integrity-ai",
    href: "/learn/durham-law-academic-integrity-ai",
    title: "Academic Integrity & AI Use",
    description:
      "Understand Durham's AI policy. What's permitted, prohibited, and how to stay compliant.",
    tags: ["Integrity", "AI"],
    category: "Ethics",
    readTime: "10 min read",
    order: 3,
  },
  {
    slug: "how-to-ask-better-legal-questions",
    href: "/learn/how-to-ask-better-legal-questions",
    title: "How to Ask Better Legal Questions",
    description:
      "The 4-layer questioning framework for tutorials, research, and Durmah.",
    tags: ["Workflow", "Legal Reasoning"],
    category: "Workflow",
    readTime: "8 min read",
    order: 4,
  },
  {
    slug: "durham-law-exam-technique",
    href: "/learn/durham-law-exam-technique",
    title: "Durham Law Exam Technique",
    description:
      "IRAC method, essay structuring, time management, and ethical AI exam prep.",
    tags: ["Performance", "Exam Prep"],
    category: "Performance",
    readTime: "11 min read",
    order: 5,
  },
  {
    slug: "stay-current",
    href: "/stay-current",
    title: "Stay Current: Legal News habit",
    description:
      "Build commercial awareness with our live legal news feed, tailored for Durham Law students.",
    tags: ["Awareness", "Professional Skills"],
    category: "Awareness",
    readTime: "5 min read",
    order: 6,
  },
  {
    slug: "durham-law-study-groups",
    href: "/learn/durham-law-study-groups",
    title: "Durham Law Study Groups",
    description:
      "Build effective, compliant study groups with optimal meeting structures.",
    tags: ["Community", "Collaboration"],
    category: "Community",
    readTime: "9 min read",
    order: 7,
  },
  {
    slug: "durham-law-wellbeing-routine",
    href: "/learn/durham-law-wellbeing-routine",
    title: "Durham Law Wellbeing Routine",
    description:
      "Balance intensive study with sustainable sleep, movement, and connection habits.",
    tags: ["Wellbeing", "Sustainability"],
    category: "Wellbeing",
    readTime: "7 min read",
    order: 8,
  },
  {
    slug: "learn-write-speak-law",
    href: "/learn/learn-write-speak-law",
    title: "Learn law. Write law. Speak law.",
    description:
      "Understand the three pillars of legal mastery. Why law school focus on reading and writing is only half the battle.",
    tags: ["Brand Pillar", "Vision"],
    category: "Brand Pillar",
    readTime: "10 min read",
    order: 9,
  },
];
