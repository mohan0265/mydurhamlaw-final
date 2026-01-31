#!/usr/bin/env node

/**
 * AUTOMATED LEXICON V1 MIGRATION + SEED
 * Constructs direct connection URL (port 5432) and executes migration + seed
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=".repeat(70));
console.log("LEXICON V1: AUTOMATED MIGRATION + VERIFICATION");
console.log("=".repeat(70) + "\n");

// ============================================================================
// 1. LOAD ENVIRONMENT - USE POOLER URL ONLY
// ============================================================================

console.log("📋 Loading environment...\n");
dotenv.config({ path: join(__dirname, "../.env.local") });

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error("❌ SUPABASE_DB_URL not found in .env.local");
  process.exit(1);
}

console.log("✅ Using SUPABASE_DB_URL (pooler connection)");

// Parse for display (redacted)
try {
  const url = new URL(SUPABASE_DB_URL);
  console.log("\n🔗 CONNECTION (redacted):");
  console.log(`   Hostname: ${url.hostname}`);
  console.log(`   Port:     ${url.port || "5432"}`);
  console.log(`   Database: ${url.pathname.slice(1)}`);
  console.log(`   User:     ${url.username}`);
  console.log(`   SSL:      true (rejectUnauthorized: false)`);
  console.log();
} catch (err) {
  console.warn("⚠️  Could not parse URL for display, proceeding...\n");
}

// ============================================================================
// 2. READ MIGRATION FILE
// ============================================================================

const migrationPath = join(
  __dirname,
  "../supabase/migrations/20260131200000_lexicon_v1_global_tables.sql",
);
const migrationSQL = readFileSync(migrationPath, "utf-8");

console.log(`📖 Migration file: ${migrationSQL.length} bytes\n`);

// ============================================================================
// 3. EXECUTE MIGRATION WITH VERIFICATION
// ============================================================================

async function executeMigration() {
  const client = new Client({
    connectionString: SUPABASE_DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected\n");

    // Test query
    console.log("🧪 Test query: SELECT now()");
    const timeResult = await client.query("SELECT now()");
    console.log(`   ✓ Server time: ${timeResult.rows[0].now}\n`);

    // Execute migration
    console.log("⚙️  Executing migration SQL...");
    console.log("   (This may take 10-30 seconds)\n");

    await client.query(migrationSQL);

    console.log("✅ Migration executed successfully!\n");

    // VERIFICATION QUERY 1: List tables
    console.log("🔍 VERIFICATION: List lexicon* tables");
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'lexicon%'
      ORDER BY tablename;
    `);

    console.log(`   Found ${tablesResult.rows.length} table(s):`);
    const foundTables = [];
    tablesResult.rows.forEach((row) => {
      console.log(`   ✓ ${row.tablename}`);
      foundTables.push(row.tablename);
    });
    console.log();

    // VERIFICATION QUERY 2: Count terms
    console.log("🔍 VERIFICATION: Count rows in lexicon_master_terms");
    const countResult = await client.query(
      "SELECT COUNT(*) as count FROM lexicon_master_terms",
    );
    const initialCount = parseInt(countResult.rows[0].count);
    console.log(`   ✓ ${initialCount} rows (migrated from existing data)\n`);

    // Check if all expected tables exist
    const expectedTables = [
      "lexicon_master_terms",
      "lexicon_unknown_queries",
      "lexicon_user_stars",
    ];
    const allTablesExist = expectedTables.every((t) => foundTables.includes(t));

    if (!allTablesExist) {
      console.error("❌ Not all expected tables found!");
      console.error("   Expected:", expectedTables);
      console.error("   Found:", foundTables);
      throw new Error("Migration incomplete");
    }

    console.log("=".repeat(70));
    console.log("✅ MIGRATION VERIFICATION PASSED");
    console.log("=".repeat(70));
    console.log(`   ✓ All 3 tables created`);
    console.log(`   ✓ ${initialCount} existing terms migrated`);
    console.log(`   ✓ Ready for seed import\n`);

    return { success: true, initialCount };
  } catch (err) {
    console.error("\n❌ MIGRATION FAILED\n");
    console.error("Error:", err.message);
    if (err.code) console.error("Code:", err.code);
    if (err.detail) console.error("Detail:", err.detail);
    throw err;
  } finally {
    await client.end();
    console.log("🔌 Connection closed\n");
  }
}

// ============================================================================
// 4. RUN MIGRATION
// ============================================================================

executeMigration()
  .then((result) => {
    console.log("🎉 Migration completed successfully!");
    console.log("\n📦 NEXT: Run seed import");
    console.log("   npm run seed:lexicon\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n💥 Migration failed:", err.message);
    process.exit(1);
  });
