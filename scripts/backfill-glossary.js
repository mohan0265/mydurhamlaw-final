const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { Client } = require("pg");

async function syncAndRefresh() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log("Connected to DB.");

    // 1. Backfill terms from lecture_notes to glossary_terms
    console.log("Backfilling glossary terms...");
    const backfillQuery = `
      WITH exploded_glossary AS (
        SELECT 
          user_id,
          lecture_id,
          (jsonb_array_elements(glossary)->>'term') as term,
          (jsonb_array_elements(glossary)->>'definition') as definition
        FROM lecture_notes
        JOIN lectures ON lectures.id = lecture_notes.lecture_id
        WHERE glossary IS NOT NULL AND jsonb_array_length(glossary) > 0
      ),
      deduplicated_terms AS (
        SELECT DISTINCT ON (user_id, term)
          user_id, term, definition
        FROM exploded_glossary
        ORDER BY user_id, term, length(definition) DESC
      ),
      inserted_terms AS (
        INSERT INTO glossary_terms (user_id, term, definition, is_manual)
        SELECT user_id, term, definition, false
        FROM deduplicated_terms
        ON CONFLICT (user_id, term) DO UPDATE SET definition = EXCLUDED.definition
        RETURNING id, user_id, term
      )
      INSERT INTO lecture_glossary_links (term_id, lecture_id)
      SELECT it.id, eg.lecture_id
      FROM inserted_terms it
      JOIN exploded_glossary eg ON eg.user_id = it.user_id AND eg.term = it.term
      ON CONFLICT (term_id, lecture_id) DO NOTHING;
    `;

    const res = await client.query(backfillQuery);
    console.log(`✓ Backfill complete. Terms synced.`);

    // 2. Refresh PostgREST cache
    console.log("Refreshing PostgREST schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✓ Cache refresh signal sent.");
  } catch (err) {
    console.error("Operation Failed:", err);
  } finally {
    await client.end();
  }
}

syncAndRefresh();
