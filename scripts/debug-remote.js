const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const id = "f88df853-9b49-439e-a958-7c7d362b8ddc";
  console.log("Checking ID:", id);
  const { data, error } = await supabase
    .from("lectures")
    .select("id, user_id, title")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Found Record:", data);
  }
}

check();
