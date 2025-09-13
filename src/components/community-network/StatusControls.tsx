import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function StatusControls() {
  const [allowDM, setAllowDM] = useState(true);
  const [showPresence, setShowPresence] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"online" | "offline">("online");
  const [userId, setUserId] = useState<string | null>(null);

  // Load current user + settings
  useEffect(() => {
    let mounted = true;

    (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id ?? null;
      if (!mounted) return;
      setUserId(uid);
      if (!uid) return;

      const { data, error } = await supabase
        .from("community_settings")
        .select("allow_dm, show_presence")
        .eq("user_id", uid)
        .maybeSingle();

      if (!error && data) {
        setAllowDM(data.allow_dm);
        setShowPresence(data.show_presence);
      }
    })();

    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  async function save(next: Partial<{ allow_dm: boolean; show_presence: boolean }>) {
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    setSaving(true);

    const payload = {
      user_id: userId,
      allow_dm: next.allow_dm ?? allowDM,
      show_presence: next.show_presence ?? showPresence,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("community_settings").upsert(payload);
    if (!error) {
      if (typeof next.allow_dm === "boolean") setAllowDM(next.allow_dm);
      if (typeof next.show_presence === "boolean") setShowPresence(next.show_presence);
    }
    setSaving(false);
  }

  async function setPresence(newStatus: "online" | "offline") {
    setStatus(newStatus);
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    if (newStatus === "online") {
      await supabase.rpc("update_presence", { p_status: "online" });
    } else {
      await supabase.rpc("go_offline");
    }
  }

  if (!userId) {
    return (
      <div className="rounded-lg border p-4">
        <div className="text-sm">
          Please <a className="underline" href="/auth">sign in</a> to manage your community settings.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="font-semibold">Your settings</span>
        <span className="text-xs text-gray-500">Control visibility and direct messages</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={showPresence}
            onChange={(e) => save({ show_presence: e.target.checked })}
          />
          Show me as online/offline
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowDM}
            onChange={(e) => save({ allow_dm: e.target.checked })}
          />
          Allow private messages
        </label>

        <div className="inline-flex items-center gap-2">
          <button
            className={`text-xs rounded px-2 py-1 border ${status === "online" ? "bg-gray-100" : ""}`}
            onClick={() => setPresence("online")}
          >
            Set Online
          </button>
          <button
            className={`text-xs rounded px-2 py-1 border ${status === "offline" ? "bg-gray-100" : ""}`}
            onClick={() => setPresence("offline")}
          >
            Set Offline
          </button>
        </div>

        {saving && <span className="text-xs text-gray-500">Saving…</span>}
      </div>
    </div>
  );
}
