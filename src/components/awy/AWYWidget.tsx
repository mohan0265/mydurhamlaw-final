// src/components/awy/AWYWidget.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAwyPresence } from "@/hooks/useAwyPresence";
import toast from "react-hot-toast";

interface Position {
  x: number;
  y: number;
}

function ringClass(status?: "online" | "offline" | "busy") {
  if (status === "busy") return "ring-amber-400";
  if (status === "online") return "ring-green-500";
  return "ring-gray-400 opacity-60";
}

function getCallUrl(lovedOneId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`awy:callurl:${lovedOneId}`) || null;
}

function getLastPosition(): Position {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  try {
    const saved = localStorage.getItem("awyWidget:position");
    return saved ? JSON.parse(saved) : { x: 16, y: 16 };
  } catch {
    return { x: 16, y: 16 };
  }
}

function savePosition(position: Position) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("awyWidget:position", JSON.stringify(position));
  } catch (error) {
    console.error("Failed to save AWY widget position:", error);
  }
}

export default function AWYWidget() {
  const { userId, connections, presenceByUser, sendWave } = useAwyPresence();
  const [position, setPosition] = useState<Position>(getLastPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Feature flag check
  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== "1") return null;
  if (!userId) return null;

  // Toast notifications for presence updates and waves
  useEffect(() => {
    const handlePresenceChange = (newPresence: Map<string, any>) => {
      connections.forEach(connection => {
        const presence = newPresence.get(connection.loved_one_id);
        const prevPresence = presenceByUser.get(connection.loved_one_id);
        
        if (presence?.status === "online" && prevPresence?.status !== "online") {
          toast.success(`${connection.relationship} is now online`, {
            icon: "💚",
            duration: 3000,
          });
        }
      });
    };

    // Listen for wave events
    const handleWaveReceived = () => {
      toast(`👋 Wave received!`, {
        icon: "👋",
        duration: 2000,
      });
    };

    // Set up listeners (this would typically be in the useAwyPresence hook)
    // For now, we'll just handle the current state
    handlePresenceChange(presenceByUser);
  }, [presenceByUser, connections]);

  const handleDragEnd = (event: any, info: any) => {
    const newPosition = {
      x: Math.max(0, Math.min(window.innerWidth - 256, position.x + info.offset.x)),
      y: Math.max(0, Math.min(window.innerHeight - 200, position.y + info.offset.y))
    };
    setPosition(newPosition);
    savePosition(newPosition);
    setIsDragging(false);
  };

  const handleSendWave = async (lovedOneId: string) => {
    try {
      const result = await sendWave(lovedOneId);
      if (result.ok) {
        toast.success("Wave sent! 👋", { duration: 2000 });
      } else {
        toast.error("Failed to send wave");
      }
    } catch (error) {
      console.error("Error sending wave:", error);
      toast.error("Failed to send wave");
    }
  };

  const handleCall = (lovedOneId: string) => {
    try {
      const callUrl = getCallUrl(lovedOneId);
      if (!callUrl) {
        toast.error("Add a call link in AWY Settings");
        return;
      }
      window.open(callUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening call URL:", error);
      toast.error("Failed to open call link");
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 30, // Below Durmah widget (z-40)
      }}
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
          // Collapsed state - just the icon
          <button
            onClick={() => setIsExpanded(true)}
            className="w-16 h-16 flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Expand Always With You widget"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsExpanded(true);
              }
            }}
          >
            <span className="text-2xl">💕</span>
          </button>
        ) : (
          // Expanded state
          <div className="p-3 w-64">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">Always With You</div>
              <div className="flex items-center gap-1">
                <a 
                  href="/settings/awy" 
                  className="text-xs underline hover:no-underline"
                  aria-label="Open AWY settings"
                >
                  Settings
                </a>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  aria-label="Collapse widget"
                >
                  ×
                </button>
              </div>
            </div>

            {connections.length === 0 ? (
              <div className="text-xs text-gray-500">
                No loved ones connected yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {connections.map((c) => {
                    const p = presenceByUser.get(c.loved_one_id);
                    const status = p?.status ?? "offline";
                    const callUrl = getCallUrl(c.loved_one_id);

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
                            animate={{
                              scale: status === "online" ? [1, 1.1, 1] : 1,
                            }}
                            transition={{
                              duration: 1,
                              repeat: status === "online" ? Infinity : 0,
                              repeatDelay: 2,
                            }}
                          >
                            <span className="text-sm">💕</span>
                          </motion.div>
                          <div className="min-w-0">
                            <div className="text-sm truncate font-medium">{c.relationship}</div>
                            <motion.div 
                              className="text-[11px] text-gray-500"
                              animate={{
                                color: status === "online" ? "#10b981" : "#6b7280"
                              }}
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
                            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 transition-colors"
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
