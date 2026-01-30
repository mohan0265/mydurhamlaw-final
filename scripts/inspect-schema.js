const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function inspectSchema() {
  console.log("Inspecting information_schema...");

  // We cannot easily query information_schema with supabase-js standard client unless we have permissions or a helpful view/function.
  // However, the Service Role *should* have access if we query via RPC or if the REST API exposes it.
  // REST API usually does NOT expose system schemas.
  // So we might be blocked here without psql.

  // ALTERNATIVE: Use the `pg` library with the connection string!
  // The user provided SUPABASE_DB_URL in .env.local.
  // I can try to use `pg` if it is installed or if I can use a raw fetch.

  // Let's try to infer if `pg` is available.
  try {
    const { Client } = require("pg");
    const client = new Client({
      connectionString: process.env.SUPABASE_DB_URL,
    });
    await client.connect();

    const res = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            ORDER BY table_name, ordinal_position;
        `);

    let md = "# DB Reality Map\n\n";
    let currentTable = "";

    res.rows.forEach((row) => {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        md += `\n## ${currentTable}\n| Column | Type |\n| --- | --- |\n`;
      }
      md += `| ${row.column_name} | ${row.data_type} |\n`;
    });

    fs.writeFileSync("docs/db-audit/db-reality-map.md", md);
    console.log("Schema dumped to docs/db-audit/db-reality-map.md");
    await client.end();
    return;
  } catch (e) {
    console.log("pg driver not found or failed:", e.message);
    console.log("Falling back to listing tables via supabase-js (limited)");
  }

  // Fallback: list known tables
  const tables = [
    "lectures",
    "assignments",
    "user_modules",
    "profiles",
    "lecture_notes",
    "lecture_transcripts",
  ];
  let md = "# DB Reality Map (Limited via REST)\n\n";

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      md += `## ${t} (Error accessing)\n${error.message}\n\n`;
    } else if (data && data.length > 0) {
      md += `## ${t}\n`;
      const keys = Object.keys(data[0]);
      md += keys.map((k) => `- ${k}`).join("\n") + "\n\n";
    } else {
      md += `## ${t} (Empty or exists)\n`;
    }
  }
  fs.writeFileSync("docs/db-audit/db-reality-map.md", md);
}

inspectSchema();
