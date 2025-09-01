// Durham LLB - Academic Year 2025-26
// Prefill dataset for "My Year In a Glance"

/**
 * Durham LLB 2025/26 - canonical academic plan used by YAAG.
 *
 * Sources (accessed 2025-08-31):
 * - Programme Handbook (year-by-year modules):
 *   https://apps.dur.ac.uk/faculty.handbook/2025/UG/programme/M104
 * - Academic dates (term windows):
 *   https://www.durham.ac.uk/academic-dates/
 * - Assessment & exam period guidance:
 *   https://www.durham.ac.uk/media/durham-university/global/global-opportunities/incoming/Law.pdf
 *
 * Rules:
 * - Term windows are strict; weeks are W1..W10 (Mondays in ISO yyyy-MM-dd).
 * - Exams/assessments are encoded as all-day (no start/end) unless an exam "window" is published.
 * - No fabricated times/days; if unknown, leave time empty so UI renders chips as all-day.
 * - Timezone: Europe/London.
 */


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
  // Weekly topics for calendar generation
  michaelmas?: { topics: string[] }; // 10 weeks
  epiphany?: { topics: string[] };   // 10 weeks  
  topics?: string[];                 // fallback for year-long modules
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

// ---- Term dates and weekly Mondays for 2025-26 (Durham) ----
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

// Year 1 - compulsory modules & term windows (see sources in header)
// Year 1 exams use EXAM_WINDOW (Easter term). We render per-day all-day chips via calendar adapter.


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
      michaelmas: {
        topics: [
          "Introduction to Tort: Purpose and Boundaries",
          "Intentional Torts: Assault, Battery and False Imprisonment", 
          "Trespass to Land and Goods",
          "The Tort of Negligence: Duty of Care",
          "Breach of Duty and Standard of Care",
          "Factual Causation: But-for Test",
          "Legal Causation: Remoteness of Damage",
          "Psychiatric Harm: Primary Victims",
          "Psychiatric Harm: Secondary Victims", 
          "Economic Loss and Pure Economic Loss"
        ]
      },
      epiphany: {
        topics: [
          "Occupiers' Liability: Visitors and Trespassers",
          "Product Liability and Consumer Protection",
          "Employers' Liability and Vicarious Liability",
          "Nuisance: Private and Public",
          "The Rule in Rylands v Fletcher",
          "Defamation: Elements and Defenses",
          "Privacy and Misuse of Private Information",
          "Remedies in Tort: Damages",
          "Remedies: Injunctions and Other Equitable Relief",
          "Revision and Problem-Solving Techniques"
        ]
      },
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
      michaelmas: {
        topics: [
          "Formation: Offer and Invitation to Treat",
          "Acceptance and Communication of Acceptance",
          "Consideration: Adequacy and Past Consideration", 
          "Promissory Estoppel and Reliance",
          "Intention to Create Legal Relations",
          "Certainty and Completeness of Terms",
          "Express Terms and Parol Evidence Rule",
          "Implied Terms: Business Efficacy",
          "Statutory Implied Terms and UCTA",
          "Misrepresentation: Types and Remedies"
        ]
      },
      epiphany: {
        topics: [
          "Duress: Economic and Physical",
          "Undue Influence and Unconscionable Bargains",
          "Mistake: Common and Mutual Mistake",
          "Frustration: Doctrine and Limits",
          "Breach of Contract: Anticipatory and Actual",
          "Remedies: Damages and Remoteness",
          "Specific Performance and Injunctions",
          "Exclusion Clauses: Construction and UCTA",
          "Third Party Rights and Privity",
          "Revision and Contract Problem Analysis"
        ]
      },
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
      michaelmas: {
        topics: [
          "History and Development of the EU",
          "Institutions: Commission, Council, Parliament",
          "Legislative Procedures and Decision-Making",
          "Direct Effect: Van Gend en Loos and Development",
          "Supremacy: Costa v ENEL and National Courts",
          "State Liability: Francovich and Conditions",
          "Fundamental Freedoms: Overview and Structure",
          "Free Movement of Goods: Article 34 TFEU",
          "Quantitative Restrictions and MEQRs",
          "Justifications: Article 36 and Mandatory Requirements"
        ]
      },
      epiphany: {
        topics: [
          "Free Movement of Persons: Workers and Citizens",
          "Right of Establishment and Services",
          "Competition Law: Article 101 TFEU",
          "Abuse of Dominant Position: Article 102",
          "State Aid and Internal Market",
          "Fundamental Rights in EU Law",
          "Judicial Review and Annulment Actions",
          "Preliminary Reference Procedure",
          "Enforcement Actions against Member States",
          "Brexit and Future EU-UK Relations"
        ]
      },
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
      michaelmas: {
        topics: [
          "Sources of the Constitution: Conventions and Law",
          "Parliamentary Sovereignty: Theory and Practice",
          "The Rule of Law: Dicey and Modern Interpretations",
          "Separation of Powers in the UK System",
          "The Crown and Royal Prerogative",
          "Parliament: Structure and Procedures",
          "Elections and the Democratic Process",
          "Constitutional Role of the Judiciary",
          "Judicial Review: Grounds and Remedies",
          "Human Rights Act 1998: Implementation"
        ]
      },
      epiphany: {
        topics: [
          "Freedom of Expression: Prior Restraint and Regulation",
          "Freedom of Assembly and Association",
          "Police Powers: Stop, Search and Arrest",
          "Privacy Rights and State Surveillance",
          "Administrative Law: Procedural Fairness",
          "Illegality and Judicial Review",
          "Irrationality: Wednesbury and Proportionality",
          "Procedural Impropriety and Natural Justice",
          "Constitutional Reform and Devolution",
          "Future Constitutional Challenges"
        ]
      },
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
      michaelmas: {
        topics: [
          "Introduction to Public Law Principles",
          "Administrative Decision-Making Processes",
          "Natural Justice: Bias and Fair Hearing",
          "Procedural Fairness in Administrative Action",
          "Legitimate Expectations Doctrine",
          "Proportionality in Administrative Law",
          "Emergency Powers and Civil Liberties",
          "Immigration Law and Human Rights",
          "Data Protection and Privacy Rights",
          "Freedom of Information and Transparency"
        ]
      },
      epiphany: {
        topics: [
          "Discrimination Law: Protected Characteristics",
          "Equality Act 2010: Direct and Indirect Discrimination",
          "Harassment and Victimisation Claims",
          "Reasonable Adjustments for Disability",
          "Employment Equality and Workplace Rights",
          "Public Sector Equality Duty",
          "Remedies in Discrimination Law",
          "International Human Rights Frameworks",
          "European Convention on Human Rights",
          "Contemporary Challenges in Individual Rights"
        ]
      },
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
      michaelmas: {
        topics: [
          "The English Legal System: Courts and Hierarchy",
          "Sources of Law: Statute and Common Law",
          "Statutory Interpretation: Literal and Purposive Approaches",
          "Precedent and the Doctrine of Stare Decisis",
          "Case Law Development and Ratio Decidendi",
          "Legal Research Methods and Databases",
          "Legal Writing and Citation Conventions",
          "Mooting and Oral Advocacy Skills",
          "Professional Ethics and Conduct",
          "Alternative Dispute Resolution Methods"
        ]
      },
      epiphany: {
        topics: [
          "Legal Problem-Solving Techniques",
          "IRAC Method: Issue, Rule, Application, Conclusion",
          "Critical Analysis of Legal Arguments",
          "Comparative Legal Systems: Civil vs Common Law",
          "International Law and Domestic Courts",
          "Law Reform: Agencies and Processes",
          "Access to Justice and Legal Aid",
          "Technology and the Future of Law",
          "Clinical Legal Education and Pro Bono Work",
          "Career Paths in Legal Practice"
        ]
      },
      assessments: [
        { type: "Essay", due: "2025-12-08", weight: 40 },
        { type: "Exam", window: EXAM_WINDOW, weight: 60 }
      ]
    }
  ]
};

// Year 2 - compulsory + typical options (verified 2025/26)



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

// Year 3 - dissertation + options (verified 2025/26)



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
