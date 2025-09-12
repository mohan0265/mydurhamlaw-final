// src/pages/settings/awy.tsx
import React, { useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authedFetch } from "@/lib/api/authedFetch";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Toaster, toast } from "react-hot-toast";
import Link from "next/link";

type AWYConnection = {
  id: string;
  email: string;
  relationship: string;
  display_name?: string | null;
  status?: "pending" | "accepted" | "blocked";
  created_at?: string;
};

const RELATIONSHIPS = [
  "Mum", "Dad", "Guardian", "Partner", "Sibling", "Grandparent", "Friend", "Other",
] as const;

const LIMIT = 3;

async function fetchConnections(): Promise<AWYConnection[]> {
  const r = await authedFetch("/api/awy/connections");
  if (r.status === 401) throw new Error("Please log in to manage AWY.");
  if (!r.ok) throw new Error(`Failed to load connections (${r.status})`);
  const data = await r.json();
  return Array.isArray(data) ? data : (data?.connections ?? []);
}

async function createConnection(payload: {
  email: string;
  relationship: string;
  display_name?: string;
}) {
  const r = await authedFetch("/api/awy/connections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (r.status === 401) throw new Error("Please log in to add loved ones.");
  if (!r.ok) {
    const msg = await safeMsg(r);
    throw new Error(msg || `Failed to add connection (${r.status})`);
  }
  return r.json();
}

async function removeConnection(id: string) {
  // DELETE with body first; fallback to querystring
  let r = await authedFetch("/api/awy/connections", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (r.status === 405 || r.status === 400) {
    r = await authedFetch(`/api/awy/connections?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
  if (r.status === 401) throw new Error("Please log in to remove loved ones.");
  if (!r.ok) {
    const msg = await safeMsg(r);
    throw new Error(msg || `Failed to remove connection (${r.status})`);
  }
  return r.json();
}

async function safeMsg(r: Response) {
  try {
    const d = await r.json();
    return d?.error || d?.message;
  } catch {
    return null;
  }
}

export default function AWYSettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: connections = [], isLoading, isError, error } = useQuery({
    queryKey: ["awy", "connections"],
    queryFn: fetchConnections,
    staleTime: 60_000,
  });

  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<string>("Mum");
  const [displayName, setDisplayName] = useState("");

  const count = connections.length;
  const canAdd = count < LIMIT;

  const addMut = useMutation({
    mutationFn: createConnection,
    onSuccess: () => {
      toast.success("Loved one added / invited.");
      setEmail("");
      setDisplayName("");
      qc.invalidateQueries({ queryKey: ["awy", "connections"] });
    },
    onError: (e: any) => toast.error(e?.message || "Add failed"),
  });

  const delMut = useMutation({
    mutationFn: removeConnection,
    onSuccess: () => {
      toast.success("Removed.");
      qc.invalidateQueries({ queryKey: ["awy", "connections"] });
    },
    onError: (e: any) => toast.error(e?.message || "Remove failed"),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      toast.error(`You can add up to ${LIMIT} loved ones.`);
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    addMut.mutate({
      email: email.trim(),
      relationship,
      display_name: displayName.trim() || undefined,
    } as any);
  };

  // NULL-SAFE supabase (prevents “possibly null”)
  const supabase = useMemo(() => getSupabaseClient(), []);
  const logout = async () => {
    try {
      await supabase?.auth.signOut();
    } finally {
      router.push("/login");
    }
  };

  return (
    <>
      <Head>
        <title>Always With You — Settings</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Always With You — Settings</h1>
          <Link href="/" className="text-sm underline">← Back to Home</Link>
        </div>

        <div className="mb-6 rounded-xl border p-4">
          <p className="text-sm text-gray-700">
            Add up to <strong>{LIMIT}</strong> loved ones to see their presence in the floating
            widget. You can invite new contacts or remove existing ones anytime.
          </p>
        </div>

        <form onSubmit={handleAdd} className="mb-8 rounded-xl border p-4 grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Loved one’s email</label>
            <input
              type="email"
              className="rounded-lg border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Relationship</label>
            <select
              className="rounded-lg border px-3 py-2"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Display name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              className="rounded-lg border px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Mum / Dad / Uncle Ravi"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              You’ve added <strong>{count}</strong> / {LIMIT}
            </div>
            <button
              type="submit"
              disabled={!canAdd || addMut.isPending}
              className="rounded-lg bg-violet-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {addMut.isPending ? "Adding…" : "Add Loved One"}
            </button>
          </div>
        </form>

        <div className="rounded-xl border">
          <div className="border-b px-4 py-3 font-medium">Your Loved Ones</div>
          {isLoading ? (
            <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
          ) : isError ? (
            <div className="px-4 py-6 text-sm text-red-600">
              {(error as any)?.message || "Failed to load."}
            </div>
          ) : connections.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-600">
              No loved ones yet. Use the form above to add one.
            </div>
          ) : (
            <ul className="divide-y">
              {connections.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium">
                      {c.display_name || c.relationship || "Loved One"}
                    </div>
                    <div className="text-xs text-gray-600">{c.email}</div>
                    {c.status && (
                      <div className="text-xs text-gray-500">Status: {c.status}</div>
                    )}
                  </div>
                  <button
                    onClick={() => delMut.mutate(c.id)}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 text-xs text-gray-500">
          Trouble managing connections?{" "}
          <button onClick={logout} className="underline">Sign out</button> and sign in again.
        </div>
      </main>

      <Toaster position="top-right" />
    </>
  );
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
