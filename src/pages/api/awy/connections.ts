// Direct-to-DB, schema-tolerant connections API
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerUser } from "@/lib/api/serverAuth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

type ConnStd = {
  id: string;
  email: string;
  relationship_label: string | null;
  display_name: string | null;
  status: string | null;
  connected_user_id: string | null;
  created_at?: string | null;
};

function mapFromA(row: any): ConnStd {
  return {
    id: row.id,
    email: row.email,
    relationship_label: row.relationship_label ?? null,
    display_name: row.display_name ?? null,
    status: row.status ?? null,
    connected_user_id: row.connected_user_id ?? null,
    created_at: row.created_at ?? null,
  };
}

function mapFromB(row: any): ConnStd {
  // student_id/loved_email/relationship schema
  return {
    id: row.id,
    email: row.loved_email,
    relationship_label: row.relationship ?? null,
    display_name: row.display_name ?? null,
    status: row.status ?? null,
    connected_user_id: row.loved_one_id ?? null,
    created_at: row.created_at ?? null,
  };
}

// try primary schema, if undefined column -> try the alternate schema
async function listConnections(userId: string): Promise<ConnStd[]> {
  // A: user_id/email/relationship_label/...
  let qA = await supabaseAdmin
    .from("awy_connections")
    .select(
      "id,email,relationship_label,display_name,status,connected_user_id,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!qA.error) return (qA.data || []).map(mapFromA);

  // B: student_id/loved_email/relationship/...
  let qB = await supabaseAdmin
    .from("awy_connections")
    .select(
      "id,student_id,loved_email,relationship,display_name,status,loved_one_id,created_at"
    )
    .eq("student_id", userId)
    .order("created_at", { ascending: false });

  if (qB.error) throw qB.error;
  return (qB.data || []).map(mapFromB);
}

async function createConnection(userId: string, email: string, relationshipLabel: string, displayName?: string | null) {
  // Try schema A insert
  let insA = await supabaseAdmin
    .from("awy_connections")
    .insert({
      user_id: userId,
      email,
      relationship_label: relationshipLabel,
      display_name: displayName ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (!insA.error) return insA.data!.id as string;

  // Fallback to schema B insert
  let insB = await supabaseAdmin
    .from("awy_connections")
    .insert({
      student_id: userId,
      loved_email: email,
      relationship: relationshipLabel,
      display_name: displayName ?? null,
      status: "pending",
      is_visible: true,
    })
    .select("id")
    .single();

  if (insB.error) throw insB.error;
  return insB.data!.id as string;
}

async function deleteConnection(userId: string, id: string) {
  // Try schema A delete (scoped to user)
  let delA = await supabaseAdmin
    .from("awy_connections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (!delA.error && (delA.count ?? 0) >= 0) return;

  // Fallback schema B
  let delB = await supabaseAdmin
    .from("awy_connections")
    .delete()
    .eq("id", id)
    .eq("student_id", userId);

  if (delB.error) throw delB.error;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = await getServerUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    switch (req.method) {
      case "GET": {
        const connections = await listConnections(user.id);
        return res.status(200).json({ connections });
      }

      case "POST": {
        // accept both payload styles
        const b = (req.body as any) || {};
        const email = b.connectionEmail || b.email;
        const relationshipLabel = b.relationshipLabel || b.relationship;
        const displayName = b.displayName ?? b.display_name ?? null;

        if (!email || !relationshipLabel) {
          return res
            .status(400)
            .json({ error: "Connection email and relationship label are required" });
        }

        const connectionId = await createConnection(user.id, email, relationshipLabel, displayName);
        return res.status(201).json({
          success: true,
          connectionId,
          message: "Connection created successfully",
        });
      }

      case "DELETE": {
        const b = (req.body as any) || {};
        const id =
          b.connectionId ||
          b.id ||
          (typeof req.query.id === "string" ? req.query.id : undefined);

        if (!id) return res.status(400).json({ error: "Connection ID is required" });

        await deleteConnection(user.id, id);
        return res.status(200).json({ success: true, message: "Connection deleted successfully" });
      }

      // If you need PUT for permissions later, wire it directly to columns you actually have.

      default: {
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (e: any) {
    console.error("[awy/connections] error:", e);
    return res.status(500).json({ error: e?.message || "service_error" });
  }
}
