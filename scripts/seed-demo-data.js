const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { Client } = require("pg");

if (!process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL");
  process.exit(1);
}

const DEMO_UID = "00000000-0000-0000-0000-000000000000";
const EU_MODULE_ID = "11111111-1111-1111-1111-111111111111";
const LECTURE1_ID = "22111111-1111-1111-1111-111111111111";
const LECTURE2_ID = "22222222-2222-2222-2222-222222222222";
const LECTURE3_ID = "22333333-3333-3333-3333-333333333333";
const ASSIGNMENT_ID = "33333333-3333-3333-3333-333333333333";
const TERM1_ID = "44111111-1111-1111-1111-111111111111";
const TERM2_ID = "44222222-2222-2222-2222-222222222222";

async function seed() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  try {
    await client.connect();
    console.log("Connected to DB.");

    // 1. Profile (Set user_id to NULL to avoid auth.users FK violation)
    console.log("Seeding profile...");
    await client.query(
      `
      INSERT INTO user_profiles (id, user_id, year, created_at, updated_at)
      VALUES ($1, NULL, 2, now(), now())
      ON CONFLICT (id) DO UPDATE SET year = 2, user_id = NULL;
    `,
      [DEMO_UID],
    );

    // 2. Legacy Module (Required by Lectures/Assignments FK)
    console.log("Seeding legacy modules...");
    await client.query(
      `
      INSERT INTO modules (id, user_id, title, code, term, created_at, updated_at)
      VALUES ($1, $2, 'EU Law: The Internal Market', 'LAW2041', 'Epiphany', now(), now())
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, code = EXCLUDED.code;
    `,
      [EU_MODULE_ID, DEMO_UID],
    );

    // 3. Module Catalog
    console.log("Seeding catalog...");
    await client.query(
      `
      INSERT INTO module_catalog (id, code, title, year_level, term, created_at)
      VALUES ($1, 'LAW2041', 'EU Law: The Internal Market', 2, 'Epiphany', now())
      ON CONFLICT (id) DO UPDATE SET title = 'EU Law: The Internal Market', year_level = 2;
    `,
      [EU_MODULE_ID],
    );

    // 4. User Module Link
    console.log("Seeding user_modules...");
    await client.query(
      `
      INSERT INTO user_modules (user_id, module_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `,
      [DEMO_UID, EU_MODULE_ID],
    );

    // 5. Lectures
    console.log("Seeding lectures...");
    const lectures = [
      [
        LECTURE1_ID,
        DEMO_UID,
        EU_MODULE_ID,
        "Free Movement of Goods: Art 34-36 TFEU",
        "Dr. Aris Georgopoulos",
        "verified",
      ],
      [
        LECTURE2_ID,
        DEMO_UID,
        EU_MODULE_ID,
        "Citizenship and the Internal Market",
        "Prof. Eleanor Spaventa",
        "verified",
      ],
      [
        LECTURE3_ID,
        DEMO_UID,
        EU_MODULE_ID,
        "The Services Directive & Beyond",
        "Dr. Garry Gabison",
        "verified",
      ],
    ];
    for (const l of lectures) {
      await client.query(
        `
        INSERT INTO lectures (id, user_id, module_id, title, lecturer_name, status, processing_state, created_at)
        VALUES ($1, $2, $3, $4, $5, 'ready', $6, now())
        ON CONFLICT (id) DO NOTHING;
      `,
        l,
      );
    }

    // 6. Artifacts
    console.log("Seeding transcripts/notes...");
    await client.query(
      `
      INSERT INTO lecture_transcripts (lecture_id, content, segments, created_at)
      VALUES ($1, 'Welcome to EU Law. Today we examine Article 34 TFEU...', '[]', now())
      ON CONFLICT (lecture_id) DO UPDATE SET content = EXCLUDED.content;
    `,
      [LECTURE1_ID],
    );

    await client.query(
      `
      INSERT INTO lecture_notes (lecture_id, notes, created_at)
      VALUES ($1, $2, now())
      ON CONFLICT (lecture_id) DO UPDATE SET notes = EXCLUDED.notes;
    `,
      [
        LECTURE1_ID,
        JSON.stringify({
          summary:
            "This lecture covers prohibitions on trade barriers within the EU.",
          key_points: [
            "Article 34 prohibits QRs and MEQRs.",
            "Mutual Recognition principle.",
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
                why_it_matters: "Starting point for goods problem questions.",
                likely_exam_angles: ["Keck vs Dassonville"],
                evidence_quotes: ['"Must cite Dassonville."'],
              },
            ],
          },
        }),
      ],
    );

    // 7. Glossary
    console.log("Seeding glossary...");
    await client.query(
      `
      INSERT INTO glossary_terms (id, user_id, term, definition, source_reference, is_manual, created_at, updated_at)
      VALUES ($1, $2, 'MEQR', 'Measures Equivalent to Quantitative Restrictions.', 'Lecture: Art 34-36 TFEU', false, now(), now())
      ON CONFLICT (id) DO UPDATE SET term = EXCLUDED.term;
    `,
      [TERM1_ID, DEMO_UID],
    );

    await client.query(
      `
      INSERT INTO glossary_terms (id, user_id, term, definition, source_reference, is_manual, created_at, updated_at)
      VALUES ($1, $2, 'Mutual Recognition', 'Goods lawfully produced in one MS should be sold in all others.', 'Lecture: Art 34-36 TFEU', false, now(), now())
      ON CONFLICT (id) DO UPDATE SET term = EXCLUDED.term;
    `,
      [TERM2_ID, DEMO_UID],
    );

    await client.query(
      `
      INSERT INTO lecture_glossary_links (term_id, lecture_id, created_at)
      VALUES ($1, $2, now()), ($3, $2, now())
      ON CONFLICT DO NOTHING;
    `,
      [TERM1_ID, LECTURE1_ID, TERM2_ID],
    );

    // 8. Academic Items
    console.log("Seeding academic_items...");
    await client.query(
      `
      INSERT INTO academic_items (id, user_id, type, title, module_id, state, created_at, updated_at)
      VALUES ($1, $2, 'assignment', 'Internal Market Problem Question', $3, $4, now(), now())
      ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state;
    `,
      [
        ASSIGNMENT_ID,
        DEMO_UID,
        EU_MODULE_ID,
        JSON.stringify({
          status: "in_progress",
          syllabus_coverage: {
            covered: ["Free Movement of Goods"],
            missing: ["Establishment"],
            alert: 'Coverage incomplete: "Establishment" topic missing',
          },
        }),
      ],
    );

    // 9. User Assignment Briefs
    console.log("Seeding user_assignment_briefs...");
    await client.query(
      `
      INSERT INTO user_assignment_briefs (id, user_id, module_id, title, deadline, source, created_at)
      VALUES ($1, $2, $3, 'Internal Market Problem Question', now() + interval '14 days', 'Uploaded PDF', now())
      ON CONFLICT (id) DO NOTHING;
    `,
      [ASSIGNMENT_ID, DEMO_UID, EU_MODULE_ID],
    );

    console.log("Seeding complete! 🚀");
  } catch (err) {
    console.error("Seeding Failed:", err);
  } finally {
    await client.end();
  }
}

seed();
