-- Migration: Demo Experience Seeding (Rich Version)
-- Filename: supabase/migrations/20260131120000_demo_experience_seeding.sql

DO $$ 
DECLARE
    demo_uid UUID := '00000000-0000-0000-0000-000000000000';
    eu_module_id UUID := '11111111-1111-1111-1111-111111111111';
    lecture1_id UUID := '22111111-1111-1111-1111-111111111111';
    lecture2_id UUID := '22222222-2222-2222-2222-222222222222';
    lecture3_id UUID := '22333333-3333-3333-3333-333333333333';
    assignment_id UUID := '33333333-3333-3333-3333-333333333333';
    
    term1_id UUID := '44111111-1111-1111-1111-111111111111';
    term2_id UUID := '44222222-2222-2222-2222-222222222222';
    term3_id UUID := '44333333-3333-3333-3333-333333333333';
BEGIN
    -- 1. Profiles & Modules
    INSERT INTO user_profiles (id, email, full_name, user_type, year_level, created_at, updated_at)
    VALUES (demo_uid, 'demo@casewaylaw.ai', 'Visitor Demo', 'student', 'Year 2', now(), now())
    ON CONFLICT (id) DO UPDATE SET full_name = 'Visitor Demo';

    INSERT INTO module_catalog (id, code, name, year_level, description, term, created_at)
    VALUES (eu_module_id, 'LAW2041', 'EU Law: The Internal Market', 'Year 2', 'A core module exploring the four freedoms.', 'Epiphany', now())
    ON CONFLICT (id) DO UPDATE SET name = 'EU Law: The Internal Market';

    INSERT INTO user_modules (user_id, module_id)
    VALUES (demo_uid, eu_module_id)
    ON CONFLICT DO NOTHING;

    -- 2. Lectures
    INSERT INTO lectures (id, user_id, module_code, module_name, title, lecturer_name, lecture_date, status, processing_state, created_at)
    VALUES 
    (lecture1_id, demo_uid, 'LAW2041', 'EU Law', 'Free Movement of Goods: Art 34-36 TFEU', 'Dr. Aris Georgopoulos', now() - interval '2 days', 'ready', 'verified', now() - interval '2 days'),
    (lecture2_id, demo_uid, 'LAW2041', 'EU Law', 'Citizenship and the Internal Market', 'Prof. Eleanor Spaventa', now() - interval '1 day', 'ready', 'verified', now() - interval '1 day'),
    (lecture3_id, demo_uid, 'LAW2041', 'EU Law', 'The Services Directive & Beyond', 'Dr. Garry Gabison', now(), 'ready', 'verified', now())
    ON CONFLICT (id) DO NOTHING;

    -- 3. Transcripts & Notes (Lecture 1)
    INSERT INTO lecture_transcripts (lecture_id, content, segments, created_at)
    VALUES (lecture1_id, 'Welcome to EU Law. Today we examine Article 34 TFEU which prohibits quantitative restrictions on imports... The Cassis de Dijon case established the principle of mutual recognition...', '[]', now())
    ON CONFLICT (lecture_id) DO UPDATE SET content = EXCLUDED.content;

    INSERT INTO lecture_notes (lecture_id, notes, created_at)
    VALUES (lecture1_id, jsonb_build_object(
        'summary', 'This lecture covers the fundamental prohibitions on trade barriers within the EU. Key concepts include Distinctly and Indistinctly Applicable measures, and the "Mandatory Requirements" exception established in Cassis de Dijon.',
        'key_points', array['Article 34 prohibits QRs and MEQRs.', 'The Dassonville formula defines MEQRs broadly.', 'Cassis de Dijon introduced mutual recognition.', 'Article 36 provides exhaustive grounds for justification.'],
        'glossary', array[
            jsonb_build_object('term', 'MEQR', 'definition', 'Measures Equivalent to Quantitative Restrictions.'),
            jsonb_build_object('term', 'Mutual Recognition', 'definition', 'The principle that goods lawfully produced in one Member State should be sold in all others.')
        ],
        'exam_signals', jsonb_build_object(
            'signal_strength', 85,
            'signals', array[
                jsonb_build_object(
                    'topic', 'Dassonville Formula',
                    'why_it_matters', 'It is the starting point for every goods problem question.',
                    'likely_exam_angles', array['Distinguishing between Keck and Dassonville', 'Applying the product requirement rule'],
                    'evidence_quotes', array['"You must cite Dassonville for any obstacle to trade."']
                )
            ]
        )
    ), now())
    ON CONFLICT (lecture_id) DO UPDATE SET notes = EXCLUDED.notes;

    -- 4. Glossary Terms
    INSERT INTO glossary_terms (id, user_id, term, definition, source_reference, is_manual, created_at, updated_at)
    VALUES 
    (term1_id, demo_uid, 'MEQR', 'Measures Equivalent to Quantitative Restrictions. Any trading rule capable of hindering, directly or indirectly, actually or potentially, intra-Community trade.', 'Lecture: Art 34-36 TFEU', false, now(), now()),
    (term2_id, demo_uid, 'Mutual Recognition', 'The principle that goods lawfully produced and marketed in one MS should in principle be admitted to the markets of other MS.', 'Lecture: Art 34-36 TFEU', false, now(), now()),
    (term3_id, demo_uid, 'Direct Effect', 'The principle that EU law can create rights which individuals can enforce in their national courts.', 'General EU Law Principles', false, now(), now())
    ON CONFLICT (id) DO UPDATE SET term = EXCLUDED.term, definition = EXCLUDED.definition;

    INSERT INTO lecture_glossary_links (id, term_id, lecture_id, created_at)
    VALUES 
    (gen_random_uuid(), term1_id, lecture1_id, now()),
    (gen_random_uuid(), term2_id, lecture1_id, now())
    ON CONFLICT DO NOTHING;

    -- 5. Assignments (SyllabusShield)
    INSERT INTO user_assignment_briefs (id, user_id, module_code, title, deadline, source, created_at)
    VALUES (assignment_id, demo_uid, 'LAW2041', 'Internal Market Problem Question', now() + interval '14 days', 'Uploaded PDF', now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO academic_items (id, user_id, type, title, module_id, state, created_at, updated_at)
    VALUES (assignment_id, demo_uid, 'assignment', 'Internal Market Problem Question', eu_module_id, 
        jsonb_build_object(
            'status', 'in_progress', 
            'syllabus_coverage', jsonb_build_object(
                'covered', array['Free Movement of Goods', 'Citizenship'],
                'missing', array['Free Movement of Establishment'],
                'alert', 'Coverage incomplete: "Establishment" topic missing from your notes'
            )
        ), now(), now())
    ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state;

END $$;
