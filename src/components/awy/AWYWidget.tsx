// src/components/awy/AWYWidget.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAwyPresence } from "@/hooks/useAwyPresence";
import toast from "react-hot-toast";

interface Position { x: number; y: number; }

function ringClass(status?: "online" | "offline" | "busy") {
  if (status === "busy") return "ring-amber-400";
  if (status === "online") return "ring-green-500";
  return "ring-gray-400 opacity-60";
}

// 👉 default now: bottom-right, 88px from right, 180px from bottom (above Durmah mic)
function computeBottomRight(): Position {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const widgetWidth = 64;   // collapsed
  const safeRight = 88;     // leave room for mic button
  const safeBottom = 180;   // sit above mic
  return { x: Math.max(16, w - widgetWidth - safeRight), y: Math.max(16, h - safeBottom) };
}

function getLastPosition(): Position {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  try {
    const saved = localStorage.getItem("awyWidget:position");
    return saved ? JSON.parse(saved) : computeBottomRight();
  } catch { return computeBottomRight(); }
}

function savePosition(position: Position) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("awyWidget:position", JSON.stringify(position)); } catch {}
}

export default function AWYWidget() {
  const {
    userId,
    connections,
    presenceByUser,
    sendWave,
    callLinks,
    wavesUnread,
    wavesUnreadRef,
    linkLovedOneByEmail,
  } = useAwyPresence();

  const [position, setPosition] = useState<Position>(getLastPosition);
  const [isExpanded, setIsExpanded] = useState(false);

  // move to bottom-right on first client render if no stored position
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("awyWidget:position");
    if (!saved) {
      const pos = computeBottomRight();
      setPosition(pos);
      savePosition(pos);
    }
  }, []);

  // feature flag + auth
  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== "1") return null;
  if (!userId) return null;

  // presence transition toast
  const prevPresenceRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const prev = prevPresenceRef.current;
    const next = new Map<string, string>();
    for (const c of connections) {
      const status = presenceByUser.get(c.loved_one_id)?.status ?? "offline";
      next.set(c.loved_one_id, status);
      const prevStatus = prev.get(c.loved_one_id) ?? "offline";
      if (status === "online" && prevStatus !== "online") {
        toast.success(`${c.relationship} is now online`, { icon: "💚", duration: 2200 });
      }
    }
    prevPresenceRef.current = next;
  }, [connections, presenceByUser]);

  // wave received toast
  useEffect(() => {
    if (wavesUnread > (wavesUnreadRef?.current ?? 0)) {
      toast("👋 Wave received!", { icon: "👋", duration: 1800 });
    }
  }, [wavesUnread, wavesUnreadRef]);

  const handleDragEnd = (_: any, info: any) => {
    const newPosition = {
      x: Math.max(0, Math.min(window.innerWidth - 256, position.x + info.offset.x)),
      y: Math.max(0, Math.min(window.innerHeight - 200, position.y + info.offset.y)),
    };
    setPosition(newPosition);
    savePosition(newPosition);
  };

  const handleSendWave = async (lovedOneId: string) => {
    const result = await sendWave(lovedOneId);
    if (result.ok) toast.success("Wave sent! 👋", { duration: 1600 });
    else toast.error("Failed to send wave");
  };

  const handleCall = (lovedOneId: string) => {
    const callUrl = callLinks?.[lovedOneId];
    if (!callUrl) { toast.error("Add a call link in AWY Settings"); return; }
    window.open(callUrl, "_blank", "noopener,noreferrer");
  };

  // empty-state form
  const [addEmail, setAddEmail] = useState("");
  const [addRel, setAddRel] = useState("Mum");
  const [adding, setAdding] = useState(false);
  const addLovedOne = async () => {
    if (!addEmail.trim()) { toast.error("Enter an email"); return; }
    setAdding(true);
    const res = await linkLovedOneByEmail(addEmail.trim(), addRel.trim());
    setAdding(false);
    if (res.ok) {
      toast.success("Loved one linked ✓");
      setAddEmail(""); setAddRel("Mum"); setIsExpanded(true);
    } else if ((res as any).error === "user_not_found") {
      toast.error("That email has not signed up yet.");
    } else {
      toast.error("Could not link loved one");
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{ position: "fixed", left: position.x, top: position.y, zIndex: 38 }} // below Durmah z-40
      className="cursor-move"
      whileDrag={{ scale: 1.05 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      role="application"
      aria-label="Always With You Widget"
      tabIndex={0}
    >
      <motion.div
        className="bg-white/90 backdrop-blur shadow-xl rounded-2xl border border-gray-200 overflow-hidden"
        animate={{ width: isExpanded ? 256 : 64 }}
        transition={{ duration: 0.2 }}
      >
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-16 h-16 flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Expand Always With You widget"
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsExpanded(true); } }}
          >
            <span className="text-2xl">💕</span>
          </button>
        ) : (
          <div className="p-3 w-64">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">Always With You</div>
              <div className="flex items-center gap-1">
                <a aria-label="Open AWY settings" className="text-xs underline hover:no-underline" href="/settings/awy">
                  Settings
                </a>
                <button onClick={() => setIsExpanded(false)} className="ml-2 text-gray-400 hover:text-gray-600" aria-label="Collapse widget">
                  ×
                </button>
              </div>
            </div>
            {connections.length === 0 ? (
              <div>
                <div className="text-xs text-gray-600 mb-2">
                  Add someone you love. When they log in, you'll see they're online.
                </div>
                <label className="block text-[11px] text-gray-500 mb-1">Loved one's email</label>
                <input
                  type="email"
                  className="w-full border rounded-md px-3 py-2 text-sm mb-2"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                <label className="block text-[11px] text-gray-500 mb-1">Relationship</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm mb-3"
                  value={addRel}
                  onChange={(e) => setAddRel(e.target.value)}
                  placeholder="Mum / Dad / Sibling"
                />
                <button
                  onClick={addLovedOne}
                  disabled={adding}
                  className="w-full text-sm px-3 py-2 rounded-md border hover:bg-gray-50"
                >
                  {adding ? "Linking..." : "Link Loved One"}
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {connections.map((c) => {
                    const p = presenceByUser.get(c.loved_one_id);
                    const status = p?.status ?? "offline";
                    const callUrl = callLinks?.[c.loved_one_id] ?? "";
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <motion.div
                            className={`w-9 h-9 rounded-full ring-2 ${ringClass(status)} bg-gray-100 flex items-center justify-center`}
                            title={p?.status_message ?? ""}
                            animate={{ scale: status === "online" ? [1, 1.1, 1] : 1 }}
                            transition={{ duration: 1, repeat: status === "online" ? Infinity : 0, repeatDelay: 2 }}
                          >
                            <span className="text-sm">💕</span>
                          </motion.div>
                          <div className="min-w-0">
                            <div className="text-sm truncate font-medium">{c.relationship}</div>
                            <motion.div 
                              className="text-[11px] text-gray-500" 
                              animate={{ color: status === "online" ? "#10b981" : "#6b7280" }}
                            >
                              {status === "online" ? "Online" : status === "busy" ? "Busy" : "Offline"}
                            </motion.div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSendWave(c.loved_one_id)}
                            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 transition-colors"
                            title="Send wave"
                            aria-label={`Send wave to ${c.relationship}`}
                          >
                            👋
                          </button>
                          <button
                            onClick={() => handleCall(c.loved_one_id)}
                            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 transition-colors disabled:opacity-50"
                            title={callUrl ? "Call" : "Set call link in Settings"}
                            aria-label={`Call ${c.relationship}`}
                            disabled={!callUrl}
                          >
                            📞
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
