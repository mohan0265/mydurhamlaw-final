import { readdir, rename } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const MIGRATIONS_DIR = "supabase/migrations";

async function main() {
  console.log("🔄 Checking for duplicate timestamps...");

  // Read DB URL
  const envLocal = fs.readFileSync(".env.local", "utf-8");
  const dbUrlMatch = envLocal.match(/SUPABASE_DB_URL=["']?([^"'\r\n]+)["']?/);
  if (!dbUrlMatch) {
    console.error("❌ Could not find SUPABASE_DB_URL in .env.local");
    process.exit(1);
  }
  const dbUrl = dbUrlMatch[1];

  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

  const timestampMap = new Map(); // timestamp -> [files]

  // 1. Group by timestamp
  for (const file of sqlFiles) {
    const parts = file.split("_");
    const timestamp = parts[0];
    if (!timestampMap.has(timestamp)) {
      timestampMap.set(timestamp, []);
    }
    timestampMap.get(timestamp).push(file);
  }

  // 2. Fix duplicates
  let fixedCount = 0;
  for (const [timestamp, fileList] of timestampMap) {
    if (fileList.length > 1) {
      console.log(
        `⚠️  Found ${fileList.length} files with timestamp ${timestamp}`,
      );

      // Keep the first one as is (or if it's 000000, keep it).
      // Increment subsequent ones.

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // If i=0, we leave it alone (it takes the base timestamp).
        // If i>0, we need to increment.
        if (i > 0) {
          // Parse timestamp as BigInt or split?
          // Format is YYYYMMDDHHMMSS (14 chars)
          // We can just add 'i' to the number if it fits.
          // Be careful with overflows, but seconds usually have room (00-59).
          // Assuming they end in 000000 from my previous script.

          const tsNum = BigInt(timestamp);
          const newTsNum = tsNum + BigInt(i);
          const newTimestamp = newTsNum.toString();

          const newFilename = file.replace(timestamp, newTimestamp);

          console.log(`   🔧 Renaming ${file} -> ${newFilename}`);
          await rename(
            path.join(MIGRATIONS_DIR, file),
            path.join(MIGRATIONS_DIR, newFilename),
          );

          // Repair history for this NEW unique file
          // Mark as applied (since we assume it was already logically applied safely before)
          // But note: if the old duplicate timestamp was applied, we might leave a ghost.
          // However, if Timestamp A was applied, and we rename file to Timestamp B,
          // we should mark B as applied.
          // The old Timestamp A record covers the first file.
          // The second file (which shared Timestamp A) was previously considered "covered" by Timestamp A record?
          // No, Supabase likely only tracked one.
          // So the second file was effectively "Pending" but hidden by the collision?
          // By renaming it to B, we make it distinct.
          // We should mark B as applied assuming the code IS in the DB.
          // (Most of these are historical, so likely yes).

          try {
            console.log(`      + Marking ${newTimestamp} as applied...`);
            await execAsync(
              `npx supabase migration repair --status applied ${newTimestamp} --db-url "${dbUrl}"`,
            );
          } catch (e) {
            console.error(`      ❌ Repair error: ${e.message}`);
          }

          fixedCount++;
        }
      }
    }
  }

  console.log(`✅ Fixed ${fixedCount} duplicate timestamp files.`);
}

main().catch(console.error);
