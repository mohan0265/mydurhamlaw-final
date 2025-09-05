// src/components/awy/AWYWidget.tsx
import React from "react";
import { useAwyPresence } from "@/hooks/useAwyPresence";

function ringClass(status?: "online" | "offline" | "busy") {
  if (status === "busy") return "ring-amber-400";
  if (status === "online") return "ring-green-500";
  return "ring-gray-400 opacity-60";
}

function getCallUrl(lovedOneId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`awy:callurl:${lovedOneId}`) || null;
}

export default function AWYWidget() {
  const { userId, connections, presenceByUser, sendWave } = useAwyPresence();

  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== "1") return null;
  if (!userId) return null;

  return (
    <div className="fixed right-4 bottom-4 z-40">
      <div className="bg-white/90 backdrop-blur shadow-xl rounded-2xl p-3 w-64 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-sm">Always With You</div>
          <a href="/settings/awy" className="text-xs underline hover:no-underline">
            Settings
          </a>
        </div>

        {connections.length === 0 ? (
          <div className="text-xs text-gray-500">
            No loved ones connected yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {connections.map((c) => {
              const p = presenceByUser.get(c.loved_one_id);
              const status = p?.status ?? "offline";
              const callUrl = getCallUrl(c.loved_one_id);

              return (
                <li key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full ring-2 ${ringClass(status)} bg-gray-100`}
                      title={p?.status_message ?? ""}
                    />
                    <div className="min-w-0">
                      <div className="text-sm truncate">{c.relationship}</div>
                      <div className="text-[11px] text-gray-500">
                        {status === "online" ? "Online" : status === "busy" ? "Busy" : "Offline"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        const r = await sendWave(c.loved_one_id);
                        if (!r.ok) alert("Failed to send wave.");
                      }}
                      className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                      title="Send wave"
                    >
                      👋
                    </button>
                    <button
                      onClick={() => {
                        if (!callUrl) {
                          alert("Add a call link in AWY Settings.");
                          return;
                        }
                        window.open(callUrl, "_blank", "noopener,noreferrer");
                      }}
                      className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                      title={callUrl ? "Call" : "Set call link in Settings"}
                    >
                      📞
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
