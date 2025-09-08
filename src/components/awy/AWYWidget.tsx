'use client';
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAwyPresence } from "@/hooks/useAwyPresence";

type AwyStatus = "online" | "offline" | "busy";
interface Position { x: number; y: number; }

function ringClass(status?: AwyStatus) {
  if (status === "busy") return "ring-amber-400";
  if (status === "online") return "ring-green-500";
  return "ring-gray-400 opacity-60";
}

// Constants for positioning and safe-zone
const WIDGET_WIDTH = 64;   // collapsed width
const SAFE_RIGHT   = 88;   // px, room for mic on right
const SAFE_BOTTOM  = 180;  // px, above mic
const MIN_MARGIN   = 16;

// Calculates bottom-right above mic
function computeBottomRight(): Position {
  if (typeof window === "undefined") return { x: MIN_MARGIN, y: MIN_MARGIN };
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    x: Math.max(MIN_MARGIN, w - WIDGET_WIDTH - SAFE_RIGHT),
    y: Math.max(MIN_MARGIN, h - SAFE_BOTTOM),
  };
}

// Restore position if present, else use safe bottom-right (with bounds check)
function getLastPosition(): Position {
  if (typeof window === "undefined") return computeBottomRight();
  try {
    const saved = localStorage.getItem("awyWidget:position");
    if (saved) {
      const { x, y } = JSON.parse(saved);
      const maxX = Math.max(MIN_MARGIN, window.innerWidth  - WIDGET_WIDTH - SAFE_RIGHT);
      const maxY = Math.max(MIN_MARGIN, window.innerHeight - SAFE_BOTTOM);
      if (typeof x === "number" && typeof y === "number" && x >= MIN_MARGIN && y >= MIN_MARGIN && x <= maxX && y <= maxY) {
        return { x, y };
      }
    }
    return computeBottomRight();
  } catch {
    return computeBottomRight();
  }
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

  // Widget position / expanded state
  const [position, setPosition] = useState<Position>({ x: MIN_MARGIN, y: MIN_MARGIN });
  const [isExpanded, setIsExpanded] = useState(false);

  // Viewport drag constraints
  const [constraints, setConstraints] = useState<{ left:number; top:number; right:number; bottom:number } | null>(null);

  // Empty-state add form
  const [addEmail, setAddEmail] = useState("");
  const [addRel, setAddRel] = useState("Mum");
  const [adding, setAdding] = useState(false);

  // Feature/auth gating as booleans (no early returns before hooks)
  const featureOn     = process.env.NEXT_PUBLIC_FEATURE_AWY === "1";
  const isAuthed      = !!userId;
  const shouldRender  = featureOn && isAuthed;

  // Mount / resize: compute constraints and keep position in bounds
  useEffect(() => {
    setPosition(getLastPosition());
    function calc() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const next = {
        left: MIN_MARGIN,
        top: MIN_MARGIN,
        right: Math.max(MIN_MARGIN, w - WIDGET_WIDTH - SAFE_RIGHT),
        bottom: Math.max(MIN_MARGIN, h - SAFE_BOTTOM),
      };
      setConstraints(next);
      setPosition(pos => ({
        x: Math.max(next.left, Math.min(pos.x, next.right)),
        y: Math.max(next.top,  Math.min(pos.y, next.bottom)),
      }));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Presence online notifications
  const prevPresenceRef = useRef(new Map<string, AwyStatus>());
  useEffect(() => {
    const prev = prevPresenceRef.current;
    const next = new Map<string, AwyStatus>();
    for (const c of connections) {
      const status = (presenceByUser.get(c.loved_one_id)?.status ?? "offline") as AwyStatus;
      next.set(c.loved_one_id, status);
      const prevStatus = prev.get(c.loved_one_id) ?? "offline";
      if (status === "online" && prevStatus !== "online") {
        toast.success(`${c.relationship} is now online`, { icon: "💚", duration: 2200 });
      }
    }
    prevPresenceRef.current = next;
  }, [connections, presenceByUser]);

  // Wave received notification
  useEffect(() => {
    if (wavesUnread > (wavesUnreadRef?.current ?? 0)) {
      toast("👋 Wave received!", { icon: "👋", duration: 1800 });
    }
  }, [wavesUnread, wavesUnreadRef]);

  // Clamp during drag
  const onDrag = (_: any, info: { point: { x:number; y:number } }) => {
    if (!constraints) return;
    const x = Math.max(constraints.left, Math.min(info.point.x, constraints.right));
    const y = Math.max(constraints.top,  Math.min(info.point.y, constraints.bottom));
    setPosition({ x, y });
  };

  // Clamp + persist at drag end
  const onDragEnd = (_: any, info: { offset: { x:number; y:number } }) => {
    if (!constraints) return;
    const nx = position.x + info.offset.x;
    const ny = position.y + info.offset.y;
    const x = Math.max(constraints.left, Math.min(nx, constraints.right));
    const y = Math.max(constraints.top,  Math.min(ny, constraints.bottom));
    const next = { x, y };
    setPosition(next);
    savePosition(next);
  };

  // Actions
  const handleSendWave = async (lovedOneId: string) => {
    const result = await sendWave(lovedOneId);
    if (result.ok) toast.success("Wave sent! 👋", { duration: 1600 });
    else toast.error("Failed to send wave");
  };

  const handleCall = (lovedOneId: string) => {
    const callUrl = callLinks?.[lovedOneId] ?? "";
    if (!callUrl) { toast.error("Add a call link in AWY Settings"); return; }
    window.open(callUrl, "_blank", "noopener,noreferrer");
  };

  const addLovedOne = async () => {
    if (!addEmail.trim()) { toast.error("Enter an email"); return; }
    setAdding(true);
    const res = await linkLovedOneByEmail(addEmail.trim(), addRel.trim());
    setAdding(false);
    if ((res as any)?.ok) {
      toast.success("Loved one linked ✓");
      setAddEmail(""); setAddRel("Mum"); setIsExpanded(true);
    } else if ((res as any)?.error === "user_not_found") {
      toast.error("That email has not signed up yet.");
    } else {
      toast.error("Could not link loved one");
    }
  };

  // Final gate AFTER hooks are set up
  if (!shouldRender) return null;

  // UI
  return (
    <motion.div
      drag
      dragMomentum={false}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      dragConstraints={constraints ?? false}
      style={{ position: "fixed", left: position.x, top: position.y, zIndex: 38 }}
      className="cursor-move focus:outline-blue-600 focus:ring-2 focus:ring-blue-600"
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
        animate={{ width: isExpanded ? 256 : 64, height: isExpanded ? 'auto' : 64 }}
        transition={{ duration: 0.2 }}
      >
        {!isExpanded ? (
          <button
            aria-label="Open AWY"
            className="w-full h-16 flex flex-col items-center justify-center focus:outline-none"
            onClick={() => setIsExpanded(true)}
            tabIndex={0}
          >
            <span className="w-9 h-9 rounded-full ring-2 ring-blue-400 bg-gray-100 flex items-center justify-center">💕</span>
            <span className="text-xs mt-1 text-gray-700 font-semibold tracking-tight">AWY</span>
          </button>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 text-base">Always With You</span>
              <a href="/settings/awy" className="text-xs underline hover:no-underline" aria-label="Open AWY settings" tabIndex={0}>Settings</a>
            </div>

            {connections.length === 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-700 mb-1">Add someone you love. When they log in, you’ll see they’re online.</div>
                <input
                  aria-label="Loved one's email"
                  className="w-full border rounded-md px-3 py-2 text-sm mb-2"
                  value={addEmail}
                  autoComplete="email"
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={adding}
                  tabIndex={0}
                />
                <input
                  aria-label="Relationship"
                  className="w-full border rounded-md px-3 py-2 text-sm mb-3"
                  value={addRel}
                  onChange={e => setAddRel(e.target.value)}
                  placeholder="Mum / Dad / Sibling"
                  disabled={adding}
                  tabIndex={0}
                />
                <button
                  onClick={addLovedOne}
                  className="w-full py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-400"
                  disabled={adding}
                  tabIndex={0}
                >
                  {adding ? "Adding..." : "Add Loved One"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {connections.map(c => {
                  const p = presenceByUser.get(c.loved_one_id);
                  const status = (typeof p?.status === "string" ? p.status : "offline") as AwyStatus;
                  const callUrl = callLinks?.[c.loved_one_id] ?? "";
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between"
                    >
                      <motion.span
                        className={`w-9 h-9 rounded-full ring-2 ${ringClass(status)} bg-gray-100 flex items-center justify-center`}
                        title={typeof p?.status_message === "string" ? p.status_message : ""}
                        animate={{ scale: status === "online" ? [1, 1.1, 1] : 1 }}
                        transition={{ duration: 1, repeat: status === "online" ? Infinity : 0, repeatDelay: 2 }}
                      >💕</motion.span>
                      <span className="flex flex-col ml-2 grow pr-2">
                        <span className="text-sm font-medium text-gray-900">{String(c.relationship || "Friend")}</span>
                        <span className="text-[11px] text-gray-500" style={{ color: status === "online" ? "#10b981" : "#6b7280" }}>
                          {status === "online" ? "Online" : status === "busy" ? "Busy" : "Offline"}
                        </span>
                      </span>
                      <div className="flex gap-1 items-center">
                        <button
                          className="rounded px-2 py-1 bg-gray-200 text-xs font-bold text-blue-900 hover:bg-green-100 transition focus:ring"
                          onClick={() => handleSendWave(c.loved_one_id)}
                          aria-label="Send wave"
                          tabIndex={0}
                        >👋</button>
                        <button
                          className="rounded px-2 py-1 bg-gray-200 text-xs font-bold text-blue-900 hover:bg-blue-100 transition focus:ring"
                          onClick={() => handleCall(c.loved_one_id)}
                          aria-label="Start call"
                          disabled={!callUrl}
                          tabIndex={0}
                        >📞</button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setIsExpanded(false)}
              className="absolute right-2 top-2 bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 transition focus:ring"
              aria-label="Collapse AWY"
              tabIndex={0}
              style={{ zIndex: 1 }}
            >×</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
