import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    console.log("[awy/invite] Starting invite process...");

    // 1. Get authenticated user
    const { user } = await getServerUser(req, res);
    if (!user) {
      console.log("[awy/invite] No user found");
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    console.log("[awy/invite] User authenticated:", user.id);

    // 2. Get request data
    const { email, relationship, displayName } = req.body || {};
    if (!email || !relationship) {
      console.log("[awy/invite] Missing email or relationship");
      return res.status(400).json({ ok: false, error: "Email and relationship are required" });
    }

    console.log("[awy/invite] Processing invite for:", email);

    // 3. Create connection directly (simplified approach)
    const connectionData = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      student_id: user.id,
      loved_email: email.toLowerCase().trim(),
      relationship: relationship.trim(),
      display_name: displayName?.trim() || null,
      status: "pending",
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("[awy/invite] Creating connection with data:", connectionData);

    // 4. Insert into database
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("awy_connections")
      .insert([connectionData])
      .select("id")
      .single();

    if (insertError) {
      console.error("[awy/invite] Insert error:", insertError);
      
      // Check if it's a duplicate error
      if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
        return res.status(409).json({ 
          ok: false, 
          error: "This email is already added as a loved one" 
        });
      }
      
      throw insertError;
    }

    console.log("[awy/invite] Connection created successfully:", insertData);

    return res.status(200).json({
      ok: true,
      connectionId: insertData.id,
      message: `Successfully added ${email} as ${relationship}`,
      status: "pending"
    });

  } catch (err: any) {
    console.error("[awy/invite] Fatal error:", err);
    console.error("[awy/invite] Error stack:", err.stack);
    
    return res.status(500).json({ 
      ok: false, 
      error: err?.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        code: err.code,
        stack: err.stack
      } : undefined
    });
  }
}
