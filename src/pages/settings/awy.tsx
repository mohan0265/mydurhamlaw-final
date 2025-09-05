// src/pages/settings/awy.tsx
import React, { useEffect, useState } from "react";
import { useAwyPresence } from "@/hooks/useAwyPresence";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AwySettingsPage() {
  const { userId, connections, reloadConnections } = useAwyPresence();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load existing call links from DB
  useEffect(() => {
    if (!userId || !connections.length) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("awy_call_links")
        .select("*")
        .eq("owner_id", userId);

      if (!error && data) {
        const next: Record<string, string> = {};
        for (const row of data) {
          next[row.loved_one_id] = row.url;
        }
        setVals(next);
      }
    };
    load();
  }, [userId, connections]);

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
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    const { error } = await supabase
                      .from("awy_call_links")
                      .upsert(
                        {
                          owner_id: userId,
                          loved_one_id: c.loved_one_id,
                          url: vals[c.loved_one_id] ?? "",
                          updated_at: new Date().toISOString(),
                        },
                        { onConflict: "owner_id,loved_one_id" }
                      );
                    setLoading(false);
                    if (error) {
                      toast.error("Failed to save");
                    } else {
                      toast.success("✅ Saved");
                    }
                  }}
                  className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
                >
                  Save
                </button>
                <button
                  onClick={async () => {
                    await reloadConnections();
                    toast("Connections reloaded");
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
