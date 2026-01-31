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
      "academic_items",
      "lectures",
      "user_assignment_briefs",
      "user_profiles",
    ];
    for (const t of tables) {
      console.log(`\n=== TABLE: ${t} ===`);
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = '${t}'
        ORDER BY ordinal_position;
      `);
      res.rows.forEach((r) =>
        console.log(`${r.column_name} (${r.data_type}) NULL:${r.is_nullable}`),
      );

      const constraints = await client.query(`
        SELECT
            tc.constraint_name, kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name = '${t}';
      `);
      console.log("Constraints:");
      constraints.rows.forEach((c) =>
        console.log(
          `${c.constraint_name}: ${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name}`,
        ),
      );
    }
  } catch (err) {
    console.error("Inspection Failed:", err);
  } finally {
    await client.end();
  }
}

inspect();
