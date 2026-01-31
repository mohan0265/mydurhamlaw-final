const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { Client } = require("pg");
const fs = require("fs");

if (!process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL");
  process.exit(1);
}

const file = "supabase/migrations/20260131113000_lecture_state_machine.sql";

async function run() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log(`Running ${file}...`);
    const sql = fs.readFileSync(file, "utf8");
    await client.query(sql);
    console.log(`✓ Applied.`);
  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    await client.end();
  }
}

run();
