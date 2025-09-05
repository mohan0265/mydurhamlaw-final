// src/pages/settings/awy.tsx
// Simple MVP page to store per-connection call URLs in localStorage.

import React, { useEffect, useState } from "react";
import { useAwyPresence } from "@/hooks/useAwyPresence";

function get(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
}
function set(key: string, v: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, v);
}

export default function AwySettingsPage() {
  const { userId, connections, reloadConnections } = useAwyPresence();
  const [vals, setVals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!connections.length) return;
    const next: Record<string, string> = {};
    for (const c of connections) {
      next[c.loved_one_id] = get(`awy:callurl:${c.loved_one_id}`);
    }
    setVals(next);
  }, [connections]);

  if (!userId) {
    return <div className="p-6">Please sign in to manage AWY settings.</div>;
  }

  return (
    <div className="max-w-2xl p-6 mx-auto">
      <h1 className="text-xl font-semibold mb-4">AWY Settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Add a video-call link (Zoom/Meet/WhatsApp call URL) for each loved one.
        AWY will open this when you tap 📞 in the widget.
      </p>

      {!connections.length ? (
        <div className="text-sm text-gray-500">No connections found.</div>
      ) : (
        <div className="space-y-4">
          {connections.map((c) => (
            <div key={c.id} className="border rounded-lg p-4">
              <div className="font-medium">{c.relationship}</div>
              <label className="block text-xs text-gray-500 mt-2 mb-1">
                Call link (URL)
              </label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="https://meet.google.com/..."
                value={vals[c.loved_one_id] ?? ""}
                onChange={(e) =>
                  setVals((s) => ({ ...s, [c.loved_one_id]: e.target.value }))
                }
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    set(`awy:callurl:${c.loved_one_id}`, vals[c.loved_one_id] ?? "");
                    alert("Saved.");
                  }}
                  className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
                >
                  Save
                </button>
                <button
                  onClick={async () => {
                    await reloadConnections();
                    alert("Connections reloaded.");
                  }}
                  className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
                >
                  Reload Connections
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
