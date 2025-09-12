// src/pages/settings/awy.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/api/authedFetch";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Conn = {
  id: string;
  email: string;
  relationship_label: string | null;
  display_name: string | null;
  status: string | null;
  connected_user_id: string | null;
};

async function apiGet<T = any>(url: string): Promise<T> {
  const r = await authedFetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function apiSend<T = any>(url: string, method: string, body?: any): Promise<T> {
  const r = await authedFetch(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

export default function AWYSettingsPage() {
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Mum");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connections, setConnections] = useState<Conn[]>([]);

  async function load() {
    try {
      const data = await apiGet<{ connections: Conn[] }>("/api/awy/connections");
      setConnections(Array.isArray(data) ? data : data?.connections ?? []);
    } catch (e) {
      console.error("Failed to load connections", e);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!email || !relationship) return;
    setSaving(true);
    try {
      await apiSend("/api/awy/connections", "POST", {
        email,
        relationship,
        displayName: displayName || undefined,
      });
      setEmail("");
      setRelationship("Mum");
      setDisplayName("");
      await load();
    } catch (e) {
      console.error("Add connection failed", e);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!id) return;
    setSaving(true);
    try {
      await apiSend("/api/awy/connections", "DELETE", { connectionId: id });
      await load();
    } catch (e) {
      console.error("Delete connection failed", e);
    } finally {
      setSaving(false);
    }
  }

  const addedCount = connections.length;
  const canAddMore = addedCount < 3;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Always With You — Settings</h1>

      <div className="mt-2 mb-6 text-sm text-gray-600">
        Add up to 3 loved ones to see their presence in the floating widget. You can invite new
        contacts or remove existing ones anytime.
      </div>

      {/* Add form */}
      <div className="rounded-lg border p-4 mb-6">
        <label className="block text-sm font-medium mb-1">Loved one’s email</label>
        <Input
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!canAddMore || saving}
        />

        <label className="block text-sm font-medium mt-4 mb-1">Relationship</label>
        <Input
          placeholder="Mum / Dad / Partner"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          disabled={!canAddMore || saving}
        />

        <label className="block text-sm font-medium mt-4 mb-1">
          Display name <span className="text-gray-400">(optional)</span>
        </label>
        <Input
          placeholder="Mum / Dad / Uncle Ravi"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={!canAddMore || saving}
        />

        <div className="mt-3 text-sm text-gray-600">
          You’ve added {addedCount} / 3
        </div>

        <div className="mt-4">
          <Button onClick={add} disabled={!canAddMore || saving || !email || !relationship}>
            {saving ? "Adding…" : "Add Loved One"}
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">Your Loved Ones</h2>

        {loading ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : connections.length === 0 ? (
          <div className="text-sm text-gray-600">No loved ones yet.</div>
        ) : (
          <ul className="space-y-3">
            {connections.map((c) => {
              const name = c.display_name || c.relationship_label || "Loved One";
              return (
                <li key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{name}</div>
                    <div className="truncate text-sm text-gray-600">{c.email}</div>
                    {c.status && (
                      <div className="text-xs text-gray-500 mt-0.5">Status: {c.status}</div>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => remove(c.id)} disabled={saving}>
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="text-xs text-gray-500 mt-4">
          Trouble managing connections?{" "}
          <Link href="/logout" className="underline">
            Sign out
          </Link>{" "}
          and sign in again.
        </div>
      </div>
    </div>
  );
}
