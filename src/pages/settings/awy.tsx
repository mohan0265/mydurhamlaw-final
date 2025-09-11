// src/pages/settings/awy.tsx
import React, { useMemo, useState } from "react";
import { Heart, Users, Video, Shield, Trash2, RefreshCw } from "lucide-react";
import { useAwyPresence } from "@/hooks/useAwyPresence";
import { getSupabaseClient } from "@/lib/supabase/client";

type Row = {
  connectionId: string;
  partnerId: string;
  relationship: string;
  online: boolean;
};

export default function AWYSettings() {
  const supabase = getSupabaseClient();
  const { userId, connections, presenceByUser, reloadConnections } = useAwyPresence();
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Build simple rows for the UI
  const rows: Row[] = useMemo(() => {
    if (!userId) return [];
    return connections
      .map((c) => {
        const partnerId = c.student_id === userId ? c.loved_one_id : c.student_id;
        if (!partnerId) return null;
        const status = presenceByUser.get(partnerId)?.status ?? "offline";
        return {
          connectionId: c.id,
          partnerId,
          relationship: c.relationship || "Loved one",
          online: status === "online",
        } as Row;
      })
      .filter(Boolean) as Row[];
  }, [connections, presenceByUser, userId]);

  const onlineCount = rows.filter((r) => r.online).length;

  async function handleRemove(connectionId: string, label: string) {
    if (!supabase) return;
    if (!window.confirm(`Remove "${label}" from your loved ones?`)) return;
    setRemovingId(connectionId);
    const { error } = await supabase.from("awy_connections").delete().eq("id", connectionId);
    setRemovingId(null);
    if (error) {
      alert(`Failed to remove: ${error.message}`);
    } else {
      reloadConnections();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
              <Heart size={24} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Always With You Settings</h1>
              <p className="text-gray-600">
                {onlineCount} online · {rows.length} linked
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={reloadConnections}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Built-in Video Calling Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Video size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Built-in Video Calling</h2>
              <p className="text-gray-600 mb-4">
                Call loved ones directly inside MyDurhamLaw — no external apps required. The AWY widget shows
                their live status and lets you start a call instantly.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Add loved ones by email in the purple AWY widget</li>
                  <li>• You’ll see their online status in real time</li>
                  <li>• Click the video icon to start a call</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Shield size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Privacy & Security</h2>
              <div className="space-y-3 text-gray-600">
                <p>• End-to-end encrypted calls</p>
                <p>• No call recordings are stored on our servers</p>
                <p>• Only you and your loved ones can see presence</p>
                <p>• You control who can link to you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Loved Ones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users size={24} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Connected Loved Ones</h2>
          </div>

          {!userId ? (
            <div className="text-center py-8">
              <Heart size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Please sign in to view your connections.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8">
              <Heart size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No loved ones linked yet.</p>
              <p className="text-gray-500 text-sm">
                Use the floating heart widget on your dashboard to add and manage your loved ones.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div
                  key={r.connectionId}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                        <Heart size={20} className="text-purple-600" />
                      </div>
                      <div
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                          r.online ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.relationship}</p>
                      <p className="text-xs font-medium">
                        {r.online ? (
                          <span className="text-green-600">● Online now</span>
                        ) : (
                          <span className="text-gray-500">○ Offline</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemove(r.connectionId, r.relationship)}
                      disabled={removingId === r.connectionId}
                      className="p-2 bg-white text-gray-600 hover:text-red-600 border rounded-full transition-all"
                      title="Unlink loved one"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
