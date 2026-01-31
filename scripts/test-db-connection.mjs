#!/usr/bin/env node

/**
 * Test DB connectivity with simple query
 */

import pg from "pg";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, "../.env.local") });

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

async function testConnection() {
  console.log("🧪 Testing Database Connectivity\n");

  const client = new Client({
    connectionString: SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔌 Connecting...");
    await client.connect();
    console.log("✅ Connected\n");

    console.log("📋 Running test query: SELECT now()");
    const result = await client.query("SELECT now()");
    console.log("✅ Query successful!");
    console.log(`   Result: ${result.rows[0].now}\n`);

    console.log("🎉 Connection test PASSED");
  } catch (err) {
    console.error("\n❌ Connection test FAILED");
    console.error("Error:", err.message);
    console.error("Code:", err.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
