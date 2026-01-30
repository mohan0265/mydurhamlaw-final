const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { Client } = require("pg");

if (!process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL");
  process.exit(1);
}

async function checkLectures() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    console.log("Connected to DB via pg.");

    const res = await client.query(`
        SELECT id, title, status, academic_item_id, created_at, error_message
        FROM lectures
        ORDER BY created_at DESC
        LIMIT 5;
    `);

    console.log(JSON.stringify(res.rows, null, 2));

    const stuck = res.rows.filter((l) =>
      [
        "processing",
        "queued",
        "uploaded",
        "transcribing",
        "summarizing",
        "failed",
      ].includes(l.status),
    );

    if (stuck.length > 0) {
      console.log("\nFound PENDING/STUCK lectures:");
      stuck.forEach((l) => {
        console.log(`- ${l.title} (${l.id}): ${l.status}`);
        console.log(`  Academic Item ID: ${l.academic_item_id}`);
        console.log(`  Error: ${l.error_message}`);
      });
    } else {
      console.log("\nNo pending lectures in top 5.");
    }

    // Check if academic items exist for these
    if (res.rows.length > 0) {
      const aids = res.rows.map((r) => r.academic_item_id).filter(Boolean);
      if (aids.length > 0) {
        const aiRes = await client.query(
          `SELECT id, title, state, type FROM academic_items WHERE id = ANY($1)`,
          [aids],
        );
        console.log("\nAssociated Academic Items:");
        console.log(JSON.stringify(aiRes.rows, null, 2));
      } else {
        console.log(
          "\nWARNING: No Academic Item IDs found on recent lectures! Migration might have failed to backfill.",
        );
      }
    }
  } catch (err) {
    console.error("PG Error:", err);
  } finally {
    await client.end();
  }
}

checkLectures();
