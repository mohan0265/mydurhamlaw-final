const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillLexicon() {
  console.log("Starting Lexicon Backfill...");

  // 1. Fetch all lecture notes
  const { data: notes, error: notesError } = await supabase
    .from("lecture_notes")
    .select("lecture_id, glossary, lectures(user_id)");

  if (notesError) {
    console.error("Error fetching notes:", notesError);
    return;
  }

  console.log(`Found ${notes.length} lectures to process.`);

  for (const row of notes) {
    const lectureId = row.lecture_id;
    const userId = row.lectures?.user_id;
    const glossary = row.glossary;

    if (!userId || !glossary || !Array.isArray(glossary)) {
      console.log(`Skipping lecture ${lectureId} (No user or glossary).`);
      continue;
    }

    console.log(
      `Processing ${glossary.length} terms for lecture ${lectureId}...`,
    );

    for (const item of glossary) {
      if (!item.term || !item.definition) continue;

      try {
        // Upsert the term
        const { data: termData, error: termError } = await supabase
          .from("glossary_terms")
          .upsert(
            { user_id: userId, term: item.term, definition: item.definition },
            { onConflict: "user_id,term" },
          )
          .select()
          .single();

        if (termError) throw termError;

        // Create the link
        const { error: linkError } = await supabase
          .from("lecture_glossary_links")
          .upsert(
            { term_id: termData.id, lecture_id: lectureId },
            { onConflict: "term_id,lecture_id" },
          );

        if (linkError) throw linkError;
      } catch (err) {
        console.error(`Failed to backfill term "${item.term}":`, err.message);
      }
    }
  }

  console.log("Backfill Complete!");
}

backfillLexicon();
