// src/pages/settings/awy.tsx

import React, { useEffect, useState } from "react";
import { useAwyPresence } from "@/hooks/useAwyPresence";
import toast from "react-hot-toast";

const validateUrl = (url: string) => {
  // Accept blank or valid https call urls
  if (!url.trim()) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export default function AwySettingsPage() {
  const {
    userId,
    connections,
    callLinks,
    reloadConnections,
  } = useAwyPresence();

  // State for call links (per loved one)
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load links to state every time callLinks or connections update
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const c of connections) {
      next[c.loved_one_id] = callLinks?.[c.loved_one_id] ?? "";
    }
    setVals(next);
  }, [connections, callLinks]);

  // Save call link for loved one ID
  const handleSave = async (lovedOneId: string) => {
    if (!validateUrl(vals[lovedOneId])) {
      toast.error("Enter a valid https:// call link or leave blank.");
      return;
    }
    setLoading(true);
    try {
      // Save to DB using Supabase
      const supabase = (await import("@/lib/supabase/client")).getSupabaseClient();
      // Upsert call link (must use authenticated user)
      const { error } = await supabase
        .from("awy_call_links")
        .upsert(
          { owner_id: userId, loved_one_id: lovedOneId, url: vals[lovedOneId] },
          { onConflict: ["owner_id", "loved_one_id"] }
        );
      setLoading(false);
      if (!error) {
        toast.success("Call link saved!", { duration: 1600 });
        reloadConnections();
      } else {
        toast.error("Save failed: " + error.message);
      }
    } catch (e: any) {
      setLoading(false);
      toast.error("Unable to save right now. Try again later.");
    }
  };

  if (!userId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please sign in to manage AWY settings.
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600 text-sm">
        No AWY connections found.
        <br />
        Add a loved one first in your AWY widget!
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="font-bold text-2xl mb-2 text-gray-900">AWY Call Settings</h2>
      <div className="mb-5 text-gray-600 text-sm">
        Add or update call links (e.g. Google Meet, WhatsApp, Zoom) for each loved one.<br />
        Leave blank to disable video calls.
      </div>
      <div className="space-y-4">
        {connections.map((c) => (
          <div
            key={c.loved_one_id}
            className="rounded-lg border p-4 bg-white flex flex-col gap-2"
          >
            <span className="font-semibold text-gray-800 text-base">
              {c.relationship}
            </span>
            <label className="text-xs text-gray-700 mb-1" htmlFor={`url-${c.loved_one_id}`}>
              Call Link (must start with https://)
            </label>
            <input
              id={`url-${c.loved_one_id}`}
              type="url"
              className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              value={vals[c.loved_one_id] ?? ""}
              onChange={(e) =>
                setVals((prev) => ({
                  ...prev,
                  [c.loved_one_id]: e.target.value,
                }))
              }
              placeholder="https://meet.google.com/..."
              disabled={loading}
              aria-label={`Call URL for ${c.relationship}`}
              autoComplete="off"
              required={false}
            />
            <button
              type="button"
              className={`w-full mt-2 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-400 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              onClick={() => handleSave(c.loved_one_id)}
              disabled={loading}
              aria-label={`Save call link for ${c.relationship}`}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
