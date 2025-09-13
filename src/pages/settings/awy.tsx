// src/pages/settings/awy.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/api/authedFetch";

/** -----------------------------
 * Helpers
 * ---------------------------- */
async function apiGet<T = any>(url: string): Promise<T> {
  const r = await authedFetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function apiSend<T = any>(url: string, method: string, body?: any): Promise<T> {
  const r = await authedFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

/** -----------------------------
 * Types (schema tolerant)
 * ---------------------------- */
type Conn = {
  id: string;
  // either old or new columns:
  email?: string | null;
  loved_email?: string | null;

  relationship?: string | null;
  relationship_label?: string | null;

  display_name?: string | null;
  status?: string | null;

  // optional linkage to an auth user
  connected_user_id?: string | null;
  loved_one_id?: string | null;
};

function normalizeConn(row: Conn) {
  return {
    id: row.id,
    email: row.email ?? row.loved_email ?? "",
    relationship: row.relationship ?? row.relationship_label ?? "",
    display_name: row.display_name ?? null,
    status: row.status ?? null,
  };
}

/** -----------------------------
 * Constants
 * ---------------------------- */
const RELN_OPTIONS = ["Mum", "Dad", "Guardian", "Partner", "Family"] as const;
const DEFAULT_RELN: string = RELN_OPTIONS[0] ?? "Mum";
const MAX = 3;

/** -----------------------------
 * Page
 * ---------------------------- */
export default function AWYSettingsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [connections, setConnections] = useState<ReturnType<typeof normalizeConn>[]>([]);

  // Form state (NOTE: strictly typed as string to avoid "possibly undefined")
  const [email, setEmail] = useState<string>("");
  const [relationship, setRelationship] = useState<string>(DEFAULT_RELN);
  const [displayName, setDisplayName] = useState<string>("");

  const used = connections.length;
  const canAddMore = used < MAX;

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await apiGet<any>("/api/awy/connections");
      const list: Conn[] = Array.isArray(data) ? data : data?.connections ?? [];
      setConnections(list.map(normalizeConn));
    } catch (e) {
      console.error("Load connections failed:", e);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async () => {
    if (!canAddMore) {
      alert("You’ve already added the maximum (3).");
      return;
    }
    if (!email.trim() || !relationship.trim()) return;

    try {
      await apiSend("/api/awy/invite", "POST", {
        email: email.trim(),
        relationship: relationship.trim(),
        displayName: displayName.trim() || undefined,
      });

      setEmail("");
      setRelationship(DEFAULT_RELN); // << strictly a string
      setDisplayName("");
      await refresh();
      alert("Loved one added. They can log in immediately.");
    } catch (e: any) {
      console.error("Add loved one failed:", e);
      alert(e?.message ?? "Failed to add loved one");
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this loved one?")) return;
    try {
      await apiSend("/api/awy/connections", "DELETE", { id });
      await refresh();
    } catch (e: any) {
      console.error("Remove loved one failed:", e);
      alert(e?.message ?? "Failed to remove loved one");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Always With You — Settings</h1>

      <p className="text-sm text-gray-600 mb-6">
        Add up to 3 loved ones to see their presence in the floating widget. You can invite new contacts or remove
        existing ones anytime.
      </p>

      {/* Form */}
      <div className="rounded-lg border bg-white p-4 mb-8">
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Loved one’s email</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!canAddMore}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Relationship</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            disabled={!canAddMore}
          >
            {RELN_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Display name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            placeholder="Mum / Dad / Uncle Ravi"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!canAddMore}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            You’ve added {used} / {MAX}
          </div>
          <button
            className={`rounded px-4 py-2 text-white ${
              canAddMore ? "bg-violet-600 hover:bg-violet-700" : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleAdd}
            disabled={!canAddMore}
          >
            Add Loved One
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium mb-3">Your Loved Ones</h2>

        {loading ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : connections.length === 0 ? (
          <div className="text-sm text-gray-600">No loved ones yet.</div>
        ) : (
          <ul className="space-y-3">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{c.relationship || "Loved One"}</div>
                  <div className="truncate text-xs text-gray-600">{c.email}</div>
                  {c.status && (
                    <div className="mt-1 text-xs">
                      Status:{" "}
                      <span
                        className={
                          c.status === "active" ? "text-green-600 font-medium" : "text-yellow-700 font-medium"
                        }
                      >
                        {c.status}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  className="text-sm rounded px-3 py-1 border hover:bg-gray-50"
                  onClick={() => handleRemove(c.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 text-right">
        <Link href="/" className="text-violet-600 underline text-sm">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
