const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { Client } = require("pg");
const fs = require("fs");

if (!process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL");
  process.exit(1);
}

const files = [
  "supabase/migrations/20260130200000_create_academic_items.sql",
  "supabase/migrations/20260130200500_backfill_academic_items.sql",
];

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log("Connected to DB.");

    for (const file of files) {
      console.log(`Running ${file}...`);
      const sql = fs.readFileSync(file, "utf8");

      // Split by statement if needed, but PG run multiple usually works if strict.
      // However, DO blocks need to be handled carefully.
      // client.query can handle multiple statements.

      // We replace "gyn" typo if present (I noticed I wrote 'gyn' instead of 'gin' in the Previous tool call)
      const fixedSql = sql.replace("USING gyn", "USING gin");

      await client.query(fixedSql);
      console.log(`✓ ${file} applied.`);
    }
  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    await client.end();
  }
}

runMigrations();
