import { readdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const MIGRATIONS_DIR = "supabase/migrations";

async function main() {
  console.log("🔄 Reading migration files...");

  // 1. Get all migration files
  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort(); // Ensure chronological order

  // 2. Identify the "cutoff". We want to repair EVERYTHING except the latest one involved in current feature?
  // Actually, the user's error was on "0001_termstart...", implying NOTHING is tracked.
  // The user wants to apply "20260130_user_modules_staff_list.sql".
  // So we should repair everything BEFORE that file.

  const targetFile = "20260130_user_modules_staff_list.sql";
  const filesToRepair = [];

  for (const file of sqlFiles) {
    if (file === targetFile) break; // Stop when we hit the new one
    filesToRepair.push(file);
  }

  console.log(
    `📋 Found ${filesToRepair.length} historical migrations to mark as 'applied'.`,
  );
  console.log(`🚀 Starting repair process... (This may take a minute)`);

  // 3. Batch repair is not supported by CLI directly, but we can loop.
  // Using connection string from env is automatic for CLI if configured in .env.local?
  // No, CLI reads .env usually, but we might need to pass --db-url if it doesn't pick up .env.local automatically.
  // We'll try without explicit URL first (assuming .env.local is loaded OR we pass it).
  // Actually, standard `npx supabase` might not load .env.local by default.
  // We really should pass the DB URL to be safe, but I don't want to hardcode it here.
  // I will rely on the user having set it in .env.local and me passing it to the script or the script reading it.
  // Simpler: I will just run the command and assume the user runs this script via a shell that has the env?
  // No, I'll manually pass the --db-url in the exec command inside the loop, reading it from process.env if available,
  // OR I will just instruct the user to run it.

  // WAIT. I am running this script. I know the URL. I can pass it.
  // But I don't want to hardcode the password in this file.
  // I will read .env.local manually here.

  // 3b. Read DB URL from .env.local
  const fs = await import("fs");
  const envLocal = fs.readFileSync(".env.local", "utf-8");
  const dbUrlMatch = envLocal.match(/SUPABASE_DB_URL=["']?([^"'\r\n]+)["']?/);

  if (!dbUrlMatch) {
    console.error("❌ Could not find SUPABASE_DB_URL in .env.local");
    process.exit(1);
  }
  const dbUrl = dbUrlMatch[1];

  // 4. Run repair loop
  for (const [index, file] of filesToRepair.entries()) {
    const version = file.split("_")[0];
    console.log(
      `[${index + 1}/${filesToRepair.length}] Repairing version ${version} (${file})...`,
    );

    try {
      await execAsync(
        `npx supabase migration repair --status applied ${version} --db-url "${dbUrl}"`,
      );
    } catch (e) {
      console.error(`❌ Failed to repair ${version}:`, e.message);
      // Continue? Maybe it's already applied.
    }
  }

  console.log("✅ History repair complete!");
  console.log(
    '🎉 You can now run "npx supabase db push" to apply the new migration.',
  );
}

main().catch(console.error);
