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
    const tables = [
      "lectures",
      "user_assignment_briefs",
      "academic_items",
      "modules",
    ];
    for (const t of tables) {
      console.log(`\n--- ${t} ---`);
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${t}';
      `);
      console.log(JSON.stringify(res.rows, null, 2));
    }
  } catch (err) {
    console.error("Inspection Failed:", err);
  } finally {
    await client.end();
  }
}

inspect();
