const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { Client } = require("pg");

if (!process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL");
  process.exit(1);
}

async function inspect() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log("--- ALL TABLES ---");
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log(
      JSON.stringify(
        res.rows.map((r) => r.table_name),
        null,
        2,
      ),
    );
  } catch (err) {
    console.error("Inspection Failed:", err);
  } finally {
    await client.end();
  }
}

inspect();
