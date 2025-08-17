// Durham LLB – Academic Year 2025–26
// Prefill dataset for "My Year In a Glance"

export type TermBlock = {
  start: string; // ISO date
  end: string;   // ISO date
  weeks: string[]; // ISO Mondays for each teaching week
};

export type Assessment =
  | { type: "Essay" | "Problem Question" | "Presentation" | "Moot"; due: string; weight?: number }
  | { type: "Exam"; window: { start: string; end: string }; weight?: number }
  | { type: "Dissertation"; wordCount: number; due: string; weight?: number };

export type ModulePlan = {
  code?: string;
  title: string;
  credits: number;
  compulsory: boolean;
  delivery: "Michaelmas" | "Epiphany" | "Michaelmas+Epiphany";
  assessments: Assessment[];
  notes?: string;
};

export type AcademicYearPlan = {
  academicYear: "2025-26";
  yearKey: "foundation" | "year1" | "year2" | "year3";
  yearLabel: "Foundation" | "Year 1" | "Year 2" | "Year 3";
  termDates: {
    induction: { start: string; end: string };
    michaelmas: TermBlock;
    epiphany: TermBlock;
    easter: TermBlock; // revision and exams
    exams: { start: string; end: string }; // main exam window
  };
  modules: ModulePlan[];
};

// ---- Term dates and weekly Mondays for 2025–26 (Durham) ----
// Induction: 2025-09-29 .. 2025-10-05
// Michaelmas teaching: 10 weeks from Mon 2025-10-06
const MICHAELMAS_WEEKS = [
  "2025-10-06","2025-10-13","2025-10-20","2025-10-27",
  "2025-11-03","2025-11-10","2025-11-17","2025-11-24",
  "2025-12-01","2025-12-08"
];

// Epiphany teaching: 10 weeks from Mon 2026-01-12
const EPIPHANY_WEEKS = [
  "2026-01-12","2026-01-19","2026-01-26","2026-02-02",
  "2026-02-09","2026-02-16","2026-02-23","2026-03-02",
  "2026-03-09","2026-03-16"
];

// Easter term (revision + exams) from Mon 2026-04-27 to Fri 2026-06-26
const EASTER_WEEKS = [
  "2026-04-27","2026-05-04","2026-05-11","2026-05-18",
  "2026-05-25","2026-06-01","2026-06-08","2026-06-15","2026-06-22"
];

// Exam window kept broad for safety. You can narrow later if needed.
const EXAM_WINDOW = { start: "2026-05-01", end: "2026-06-30" };

// Helpful anchors for formative deadlines
const M_W6 = "2025-11-10"; // Michaelmas Week 6 Monday
const E_W6 = "2026-02-16"; // Epiphany Week 6 Monday

// ---------- Foundation (optional route) ----------
export const DURHAM_LLB_2025_26_FOUNDATION: AcademicYearPlan = {
  academicYear: "2025-26",
  yearKey: "foundation",
  yearLabel: "Foundation",
  termDates: {
    induction: { start: "2025-09-29", end: "2025-10-05" },
    michaelmas: { start: "2025-10-06", end: "2025-12-12", weeks: MICHAELMAS_WEEKS },
    epiphany: { start: "2026-01-12", end: "2026-03-20", weeks: EPIPHANY_WEEKS },
    easter: { start: "2026-04-27", end: "2026-06-26", weeks: EASTER_WEEKS },
    exams: EXAM_WINDOW
  },
  modules: [
    {
      title: "Foundations of Law and Society",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: M_W6, weight: 30 },
        { type: "Presentation", due: "2026-03-09", weight: 20 },
        { type: "Exam", window: EXAM_WINDOW, weight: 50 }
      ],
      notes: "Bridging content to prepare for LLB entry."
    },
    {
      title: "Academic Skills and Legal Method",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: "2025-12-01", weight: 40 },
        { type: "Problem Question", due: "2026-03-02", weight: 60 }
      ]
    },
    {
      title: "Humanities Elective A",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas+Epiphany",
      assessments: [{ type: "Exam", window: EXAM_WINDOW, weight: 100 }]
    },
    {
      title: "Humanities Elective B",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas+Epiphany",
      assessments: [{ type: "Essay", due: E_W6, weight: 100 }]
    },
    {
      title: "Quantitative Skills for Social Sciences",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas+Epiphany",
      assessments: [{ type: "Exam", window: EXAM_WINDOW, weight: 100 }]
    },
    {
      title: "Writing and Critical Thinking",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas",
      assessments: [{ type: "Essay", due: "2025-11-24", weight: 100 }]
    }
  ]
};

// ---------- Year 1 (all mandatory) ----------
export const DURHAM_LLB_2025_26_Y1: AcademicYearPlan = {
  academicYear: "2025-26",
  yearKey: "year1",
  yearLabel: "Year 1",
  termDates: {
    induction: { start: "2025-09-29", end: "2025-10-05" },
    michaelmas: { start: "2025-10-06", end: "2025-12-12", weeks: MICHAELMAS_WEEKS },
    epiphany: { start: "2026-01-12", end: "2026-03-20", weeks: EPIPHANY_WEEKS },
    easter: { start: "2026-04-27", end: "2026-06-26", weeks: EASTER_WEEKS },
    exams: EXAM_WINDOW
  },
  modules: [
    {
      code: "LAW1051",
      title: "Tort Law",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: M_W6, weight: 25 },
        { type: "Problem Question", due: E_W6, weight: 25 },
        { type: "Exam", window: EXAM_WINDOW, weight: 50 }
      ]
    },
    {
      code: "LAW1071",
      title: "Contract Law",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: "2025-12-01", weight: 25 },
        { type: "Problem Question", due: "2026-03-02", weight: 25 },
        { type: "Exam", window: EXAM_WINDOW, weight: 50 }
      ]
    },
    {
      code: "LAW1061",
      title: "European Union Law",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: "2025-11-24", weight: 30 },
        { type: "Exam", window: EXAM_WINDOW, weight: 70 }
      ]
    },
    {
      code: "LAW1091",
      title: "UK Constitutional Law",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: M_W6, weight: 30 },
        { type: "Exam", window: EXAM_WINDOW, weight: 70 }
      ]
    },
    {
      code: "LAW1081",
      title: "The Individual and the State",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Problem Question", due: "2026-03-09", weight: 40 },
        { type: "Exam", window: EXAM_WINDOW, weight: 60 }
      ]
    },
    {
      code: "LAW1121",
      title: "Introduction to English Law and Legal Method",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: "2025-12-08", weight: 40 },
        { type: "Exam", window: EXAM_WINDOW, weight: 60 }
      ]
    }
  ]
};

// ---------- Year 2 (Criminal Law compulsory; Land + Trusts strongly recommended for QLD) ----------
export const DURHAM_LLB_2025_26_Y2: AcademicYearPlan = {
  academicYear: "2025-26",
  yearKey: "year2",
  yearLabel: "Year 2",
  termDates: {
    induction: { start: "2025-09-29", end: "2025-10-05" },
    michaelmas: { start: "2025-10-06", end: "2025-12-12", weeks: MICHAELMAS_WEEKS },
    epiphany: { start: "2026-01-12", end: "2026-03-20", weeks: EPIPHANY_WEEKS },
    easter: { start: "2026-04-27", end: "2026-06-26", weeks: EASTER_WEEKS },
    exams: EXAM_WINDOW
  },
  modules: [
    {
      code: "LAW2221",
      title: "Criminal Law",
      credits: 20,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: M_W6, weight: 30 },
        { type: "Exam", window: EXAM_WINDOW, weight: 70 }
      ]
    },
    {
      code: "LAW2011",
      title: "Land Law",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Problem Question", due: "2026-03-02", weight: 40 },
        { type: "Exam", window: EXAM_WINDOW, weight: 60 }
      ],
      notes: "Required for QLD status."
    },
    {
      code: "LAW2211",
      title: "Trusts Law",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas+Epiphany",
      assessments: [
        { type: "Essay", due: "2025-12-01", weight: 40 },
        { type: "Exam", window: EXAM_WINDOW, weight: 60 }
      ],
      notes: "Required for QLD status."
    },
    {
      code: "LAW2131",
      title: "Public International Law",
      credits: 20,
      compulsory: false,
      delivery: "Epiphany",
      assessments: [{ type: "Exam", window: EXAM_WINDOW, weight: 100 }]
    },
    {
      code: "LAW2241",
      title: "Commercial Law",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas",
      assessments: [{ type: "Exam", window: EXAM_WINDOW, weight: 100 }]
    },
    {
      code: "LAW2111",
      title: "Employment Law",
      credits: 20,
      compulsory: false,
      delivery: "Epiphany",
      assessments: [{ type: "Essay", due: "2026-03-09", weight: 100 }]
    }
  ]
};

// ---------- Year 3 (Dissertation compulsory) ----------
export const DURHAM_LLB_2025_26_Y3: AcademicYearPlan = {
  academicYear: "2025-26",
  yearKey: "year3",
  yearLabel: "Year 3",
  termDates: {
    induction: { start: "2025-09-29", end: "2025-10-05" },
    michaelmas: { start: "2025-10-06", end: "2025-12-12", weeks: MICHAELMAS_WEEKS },
    epiphany: { start: "2026-01-12", end: "2026-03-20", weeks: EPIPHANY_WEEKS },
    easter: { start: "2026-04-27", end: "2026-06-26", weeks: EASTER_WEEKS },
    exams: EXAM_WINDOW
  },
  modules: [
    {
      code: "LAW3022",
      title: "Dissertation",
      credits: 40,
      compulsory: true,
      delivery: "Michaelmas+Epiphany",
      assessments: [{ type: "Dissertation", wordCount: 12000, due: "2026-03-16", weight: 100 }],
      notes: "Independent research project. Supervision across Michaelmas and Epiphany."
    },
    {
      title: "Company Law",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas",
      assessments: [{ type: "Exam", window: EXAM_WINDOW, weight: 100 }]
    },
    {
      title: "International Human Rights",
      credits: 20,
      compulsory: false,
      delivery: "Epiphany",
      assessments: [{ type: "Essay", due: "2026-03-02", weight: 100 }]
    },
    {
      title: "Competition Law",
      credits: 20,
      compulsory: false,
      delivery: "Michaelmas",
      assessments: [{ type: "Exam", window: EXAM_WINDOW, weight: 100 }]
    },
    {
      title: "Private International Law",
      credits: 20,
      compulsory: false,
      delivery: "Epiphany",
      assessments: [{ type: "Exam", window: EXAM_WINDOW, weight: 100 }]
    }
  ]
};
