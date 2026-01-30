import { readdir, rename } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const MIGRATIONS_DIR = "supabase/migrations";

async function main() {
  console.log("🔄 analyzing migration filenames...");

  // Read DB URL
  const envLocal = fs.readFileSync(".env.local", "utf-8");
  const dbUrlMatch = envLocal.match(/SUPABASE_DB_URL=["']?([^"'\r\n]+)["']?/);
  if (!dbUrlMatch) {
    console.error("❌ Could not find SUPABASE_DB_URL in .env.local");
    process.exit(1);
  }
  const dbUrl = dbUrlMatch[1];

  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files.filter((f) => f.endsWith(".sql"));

  let fixedCount = 0;

  for (const file of sqlFiles) {
    const parts = file.split("_");
    const timestamp = parts[0];

    // Check if timestamp is 8 characters (YYYYMMDD) instead of 14 (YYYYMMDDHHMMSS)
    if (timestamp.length === 8) {
      const newTimestamp = timestamp + "000000";
      const newFilename = file.replace(timestamp, newTimestamp);

      console.log(`🔧 Fixing ${file} -> ${newFilename}`);

      // 1. Rename file
      await rename(
        path.join(MIGRATIONS_DIR, file),
        path.join(MIGRATIONS_DIR, newFilename),
      );

      // 2. Update remote history: Apply NEW, Revert OLD
      // We do this sequentially to avoid race conditions or overload
      try {
        // Mark new as applied
        console.log(`   + Marking ${newTimestamp} as applied...`);
        await execAsync(
          `npx supabase migration repair --status applied ${newTimestamp} --db-url "${dbUrl}"`,
        );

        // Mark old as reverted (to remove it from history so it doesn't conflict)
        console.log(`   - Reverting ${timestamp} record...`);
        await execAsync(
          `npx supabase migration repair --status reverted ${timestamp} --db-url "${dbUrl}"`,
        );

        fixedCount++;
      } catch (e) {
        console.error(`   ❌ Error updating history for ${file}: ${e.message}`);
      }
    }
  }

  console.log(`✅ Normalized ${fixedCount} migration files.`);
}

main().catch(console.error);
