#!/usr/bin/env node

/**
 * Lexicon Seed Import Script
 * Imports 472 UK law terms from CSV into lexicon_master_terms
 * Uses Supabase JS client (not direct DB connection)
 * IDEMPOTENT: Can be run multiple times safely
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=".repeat(70));
console.log("LEXICON SEED IMPORT: 472 UK LAW TERMS");
console.log("=".repeat(70) + "\n");

// ============================================================================
// CONFIGURATION
// ============================================================================

const CSV_PATH = join(__dirname, "../data/lexicon/uk_lexicon_seed_472.csv");

// Load environment
dotenv.config({ path: join(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

console.log("✅ Environment loaded\n");

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate URL-safe slug from term
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parse CSV field that may contain multiple values separated by | ; or ,
 */
function parseArrayField(field) {
  if (!field || field.trim() === "") return [];

  return field
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parse CSV line respecting quoted fields
 */
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields.map((f) => f.replace(/^"|"$/g, ""));
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function importLexiconSeed() {
  console.log("📖 Reading CSV...\n");

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read and parse CSV
  const csvContent = readFileSync(CSV_PATH, "utf-8");
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

  const header = parseCSVLine(lines[0]);
  console.log(`📋 CSV Headers: ${header.join(", ")}`);
  console.log(`📊 Total rows: ${lines.length - 1}\n`);

  // Process each row
  const terms = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    if (fields.length < 4) {
      skipped++;
      continue;
    }

    const [
      term,
      areaOfLaw,
      priorityStr,
      commonInYear,
      aliasesStr,
      confusionStr,
    ] = fields;

    if (!term || term.trim() === "") {
      skipped++;
      continue;
    }

    terms.push({
      term: term.trim(),
      slug: slugify(term),
      area_of_law:
        areaOfLaw && areaOfLaw.trim() !== "" ? areaOfLaw.trim() : null,
      priority: parseInt(priorityStr) || 3,
      common_in_year:
        commonInYear && commonInYear.trim() !== "" ? commonInYear.trim() : null,
      aliases: parseArrayField(aliasesStr || ""),
      confusion_with: parseArrayField(confusionStr || ""),
      source: "seed",
      short_def: null,
      long_def: null,
    });
  }

  console.log(`✅ Parsed ${terms.length} valid terms`);
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} invalid rows`);
  }
  console.log();

  // Upsert to database
  console.log("💾 Upserting terms to lexicon_master_terms...\n");

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const term of terms) {
    try {
      // Check if term exists (case-insensitive)
      const { data: existing, error: fetchError } = await supabase
        .from("lexicon_master_terms")
        .select("id, short_def, long_def, source")
        .ilike("term", term.term)
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existing) {
        // UPDATE: Only update if source is still 'seed'
        if (existing.source === "seed") {
          const { error: updateError } = await supabase
            .from("lexicon_master_terms")
            .update({
              slug: term.slug,
              area_of_law: term.area_of_law,
              priority: term.priority,
              common_in_year: term.common_in_year,
              aliases: term.aliases,
              confusion_with: term.confusion_with,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) throw updateError;
          updated++;
          console.log(`  ✓ Updated: ${term.term}`);
        } else {
          console.log(`  ⊙ Skipped (${existing.source}): ${term.term}`);
        }
      } else {
        // INSERT new term
        const { error: insertError } = await supabase
          .from("lexicon_master_terms")
          .insert(term);

        if (insertError) throw insertError;
        inserted++;
        console.log(`  + Inserted: ${term.term}`);
      }
    } catch (err) {
      console.error(`  ✗ Error processing "${term.term}":`, err.message);
      errors++;
    }
  }

  // Final verification
  console.log("\n🔍 Verifying final count...");
  const { count, error: countError } = await supabase
    .from("lexicon_master_terms")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("❌ Error counting terms:", countError.message);
  } else {
    console.log(`📊 Total terms in database: ${count}\n`);
  }

  // Summary
  console.log("=".repeat(70));
  console.log("📊 IMPORT SUMMARY");
  console.log("=".repeat(70));
  console.log(`✅ Inserted:  ${inserted}`);
  console.log(`♻️  Updated:   ${updated}`);
  console.log(`❌ Errors:    ${errors}`);
  console.log(`📦 Total:     ${terms.length}`);
  console.log(`🎯 Expected:  472`);
  console.log(`💾 Database:  ${count || "unknown"}`);
  console.log("=".repeat(70) + "\n");

  if (errors === 0 && count >= 472) {
    console.log("🎉 Seed import completed successfully!");
    console.log(`✅ ${count} terms now in lexicon_master_terms\n`);
  } else if (errors > 0) {
    console.log("⚠️  Seed import completed with errors.");
    process.exit(1);
  } else {
    console.log(`⚠️  Warning: Expected at least 472 terms, found ${count}`);
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

importLexiconSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n💥 Import failed:", err.message);
    console.error(err);
    process.exit(1);
  });
