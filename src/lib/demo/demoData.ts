// src/lib/demo/demoData.ts

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export interface DemoLecture {
  id: string;
  title: string;
  lecturer_name: string;
  module_name: string;
  module_code: string;
  status: string;
  processing_state: string;
  notes: any;
  transcript: string;
}

export const DEMO_DATA = {
  profile: {
    id: DEMO_USER_ID,
    full_name: "Visitor Demo",
    email: "demo@casewaylaw.ai",
    year: 2,
    user_type: "student",
  },
  module: {
    id: "11111111-1111-1111-1111-111111111111",
    code: "LAW2041",
    title: "EU Law: The Internal Market",
    year_level: 2,
    term: "Epiphany",
  },
  lectures: [
    {
      id: "eu-law-goods",
      title: "Free Movement of Goods: Art 34-36 TFEU",
      lecturer_name: "Dr. Aris Georgopoulos",
      module_name: "EU Law",
      module_code: "LAW2041",
      status: "ready",
      processing_state: "verified",
      transcript:
        'Welcome to EU Law. Today we examine Article 34 TFEU which prohibits quantitative restrictions on imports. The Dassonville formula defines MEQRs broadly: "All trading rules enacted by Member States which are capable of hindering, directly or indirectly, actually or potentially, intra-Community trade." The Cassis de Dijon case established the principle of mutual recognition.',
      notes: {
        summary:
          "This lecture covers prohibitions on trade barriers within the EU, specifically Articles 34-36 TFEU.",
        key_points: [
          "Article 34 prohibits QRs and MEQRs.",
          "Dassonville formula: Broad definition of MEQRs.",
          'Cassis de Dijon: Mutual Recognition & "Mandatory Requirements" exception.',
          "Article 36: Exhaustive grounds for justification (Public health, morality, etc.)",
        ],
        glossary: [
          {
            term: "MEQR",
            definition: "Measures Equivalent to Quantitative Restrictions.",
          },
          {
            term: "Mutual Recognition",
            definition:
              "Goods lawfully produced in one MS should be sold in all others.",
          },
        ],
        exam_signals: {
          signal_strength: 85,
          signals: [
            {
              topic: "Dassonville Formula",
              why_it_matters:
                "The starting point for every goods problem question.",
              likely_exam_angles: ["Keck vs Dassonville"],
              evidence_quotes: [
                '"Must cite Dassonville for any obstacle to trade."',
              ],
            },
          ],
        },
      },
    },
    {
      id: "eu-law-citizenship",
      title: "Citizenship and the Internal Market",
      lecturer_name: "Prof. Eleanor Spaventa",
      module_name: "EU Law",
      module_code: "LAW2041",
      status: "ready",
      processing_state: "verified",
      transcript:
        "In this session, we investigate the concept of Union Citizenship. Unlike the economic freedoms, citizenship provides a status that is not dependent on economic activity...",
      notes: {
        summary:
          'Mastering the shift from "Market Citizen" to "Union Citizen". Status vs Economic Activity.',
        key_points: [
          "Art 20 TFEU: Fundamental status of nationals.",
          "Art 21 TFEU: Right to move and reside.",
          "The Baumbast case and its implications.",
        ],
      },
    },
  ],
  assignment: {
    id: "demo-assignment",
    title: "Internal Market Problem Question",
    module_code: "LAW2041",
    deadline: "2026-02-14T23:59:59Z",
    syllabus_coverage: {
      covered: ["Free Movement of Goods", "Citizenship"],
      missing: ["Establishment"],
      alert:
        'Coverage incomplete: "Establishment" topic missing from your notes',
    },
  },
  glossary: [
    {
      id: "term-meqr",
      term: "MEQR",
      definition:
        "Measures Equivalent to Quantitative Restrictions. Any trading rule capable of hindering, directly or indirectly, actually or potentially, intra-Community trade.",
      source: "eu-law-goods",
    },
    {
      id: "term-mutual-rec",
      term: "Mutual Recognition",
      definition:
        "The principle that goods lawfully produced and marketed in one MS should in principle be admitted to the markets of other MS.",
      source: "eu-law-goods",
    },
  ],
};

export function getDemoLecture(id: string) {
  return DEMO_DATA.lectures.find((l) => l.id === id);
}
