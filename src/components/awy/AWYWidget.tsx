// src/components/awy/AWYWidget.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Heart, Video, UserPlus, X, Settings, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCallModal } from "../VideoCall/VideoCallModal";
import { useAwyPresence } from "@/hooks/useAwyPresence";
import { getSupabaseClient } from "@/lib/supabase/client";

interface AWYWidgetProps {
  className?: string;
}

type LovedListItem = {
  id: string | null;       // partner user_id (null while 'pending')
  connectionId: string;    // awy_connections.id
  label: string;           // relationship like "Mum"
  online: boolean;
  pending: boolean;
};

export const AWYWidget: React.FC<AWYWidgetProps> = ({ className = "" }) => {
  const supabase = getSupabaseClient();
  const {
    userId,
    connections,
    presenceByUser,
    sendWave,
    linkLovedOneByEmail,
    reloadConnections,
    callLinks,
  } = useAwyPresence();

  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLovedOneEmail, setNewLovedOneEmail] = useState("");
  const [newLovedOneRelationship, setNewLovedOneRelationship] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [videoCallState, setVideoCallState] = useState<{
    isOpen: boolean;
    lovedOneName: string;
    lovedOneId: string;
    isInitiator: boolean;
  }>({
    isOpen: false,
    lovedOneName: "",
    lovedOneId: "",
    isInitiator: false,
  });

  const widgetRef = useRef<HTMLDivElement>(null);

  // ---------- position: load/save ----------
  useEffect(() => {
    try {
      const saved = localStorage.getItem("awy-widget-position");
      if (saved) {
        const parsed = JSON.parse(saved);
        const maxX = window.innerWidth - 320;
        const maxY = window.innerHeight - 450;
        setPosition({
          x: Math.max(20, Math.min(parsed.x, maxX)),
          y: Math.max(20, Math.min(parsed.y, maxY)),
        });
      }
    } catch {}
  }, []);

  const savePosition = (p: { x: number; y: number }) => {
    try {
      localStorage.setItem("awy-widget-position", JSON.stringify(p));
    } catch {}
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === widgetRef.current || (e.target as Element).closest(".drag-handle")) {
      setIsDragging(true);
      const rect = widgetRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - (isExpanded ? 320 : 60);
      const maxY = window.innerHeight - (isExpanded ? 450 : 60);
      const clamped = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      };
      setPosition(clamped);
    };
    const onUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
      }
    };
    if (isDragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, dragOffset, position, isExpanded]);

  // ---------- derive list from connections + presence ----------
  const partnerOf = useCallback(
    (conn: any) => {
      if (!userId) return null as string | null;
      // If the student is the current user, partner is loved_one_id (may be null while pending)
      // If the loved one is current user, partner is the student_id (never null)
      return conn.student_id === userId ? (conn.loved_one_id as string | null) : (conn.student_id as string | null);
    },
    [userId]
  );

  const list: LovedListItem[] =
    connections.map((c) => {
      const otherId = partnerOf(c); // may be null while pending (student side)
      const pending = !otherId;     // pending until loved one signs in (and gets linked)
      const pres = otherId ? presenceByUser.get(otherId) : undefined;
      const online = pres?.status === "online";
      const label = c.relationship || "Loved One";
      return { id: otherId ?? null, connectionId: c.id, label, online: !!online, pending };
    }) ?? [];

  const onlineCount = list.filter((i) => i.online).length;

  // ---------- actions ----------
  const handleAddLovedOne = async () => {
    const email = newLovedOneEmail.trim();
    const relation = newLovedOneRelationship.trim();
    if (!email || !relation) return;
    if (!userId) return alert("Please sign in again.");

    setIsLoading(true);
    try {
      const r = await linkLovedOneByEmail(email, relation);

      if (r.ok) {
        // r.status will be "pending" for new emails, "active" if they already have an account
        if (r.status === "active") {
          alert("Loved one linked.");
        } else {
          alert("Invite saved. They'll appear here once they sign in with Google.");
        }
        setNewLovedOneEmail("");
        setNewLovedOneRelationship("");
        setShowAddForm(false);
        reloadConnections();
        return;
      }

      const err = (r.error ?? "").toLowerCase();
      if (err.includes("max_loved_ones_reached")) {
        alert("You can link up to 3 loved ones.");
      } else if (err.includes("cannot_link_self")) {
        alert("You cannot link your own email.");
      } else if (err.includes("not_authenticated")) {
        alert("Please sign in and try again.");
      } else {
        alert(`Could not add loved one: ${r.error}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeLovedOne = async (connectionId: string, label: string) => {
    if (!supabase || !connectionId) return;
    const ok = window.confirm(`Remove "${label}"? This will unlink them from your AWY list.`);
    if (!ok) return;
    const { error } = await supabase.from("awy_connections").delete().eq("id", connectionId);
    if (error) {
      alert(`Failed to remove: ${error.message}`);
      return;
    }
    reloadConnections();
  };

  const startVideoCall = (item: LovedListItem) => {
    if (!item.id || item.pending) return;
    const deepLink = callLinks[item.id];
    if (deepLink) {
      window.open(deepLink, "_blank", "noopener,noreferrer");
      return;
    }
    setVideoCallState({
      isOpen: true,
      lovedOneName: item.label,
      lovedOneId: item.id,
      isInitiator: true,
    });
  };

  const closeVideoCall = () => {
    setVideoCallState({
      isOpen: false,
      lovedOneName: "",
      lovedOneId: "",
      isInitiator: false,
    });
  };

  const onWave = async (targetId: string | null) => {
    if (!targetId) return;
    const r = await sendWave(targetId);
    if (r.ok) alert("👋 Wave sent!");
    else alert(`Wave failed: ${r.error}`);
  };

  // ---------- UI ----------
  return (
    <>
      <motion.div
        ref={widgetRef}
        className={`fixed z-50 ${className}`}
        style={{ left: position.x, top: position.y, cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <AnimatePresence>
          {!isExpanded ? (
            // Collapsed
            <motion.div key="collapsed" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-xl transition-all duration-300 cursor-pointer drag-handle transform hover:scale-110"
                onClick={() => setIsExpanded(true)}
              >
                <Heart size={28} className="fill-current animate-pulse" />
              </div>
              {onlineCount > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{onlineCount}</span>
                </div>
              )}
            </motion.div>
          ) : (
            // Expanded
            <motion.div
              key="expanded"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 max-h-[500px] overflow-hidden backdrop-blur-sm"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex justify-between items-center drag-handle">
                <div className="flex items-center space-x-3">
                  <Heart size={24} className="fill-current animate-pulse" />
                  <div>
                    <span className="font-bold text-lg">Always With You</span>
                    <p className="text-xs opacity-90">{onlineCount} online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open("/settings/awy", "_blank")}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title="Settings"
                  >
                    <Settings size={18} />
                  </button>
                  <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Close">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {!userId ? (
                  <div className="text-center py-8">
                    <Heart size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2 font-medium">Please sign in</p>
                    <p className="text-gray-500 text-sm">Log in to manage your loved ones.</p>
                  </div>
                ) : list.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4 font-medium">No loved ones connected yet</p>
                    <p className="text-gray-500 text-sm mb-6">Add family and friends to stay connected during your studies</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2 mx-auto transform hover:scale-105 shadow-lg"
                    >
                      <UserPlus size={18} />
                      <span className="font-medium">Add Loved One</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {list.map((item) => (
                      <div
                        key={item.connectionId}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                              <Heart size={20} className="text-purple-600" />
                            </div>
                            <div
                              className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                                item.online ? "bg-green-500 animate-pulse" : "bg-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              {item.label}
                              {item.pending && (
                                <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                                  <Clock className="mr-1 h-3 w-3" /> Pending
                                </span>
                              )}
                            </p>
                            <p className="text-xs font-medium">
                              {item.pending ? (
                                <span className="text-amber-600">Awaiting their first sign-in</span>
                              ) : item.online ? (
                                <span className="text-green-600">● Online now</span>
                              ) : (
                                <span className="text-gray-500">○ Offline</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            {!item.pending && item.id ? (
                              <>
                                <button
                                  onClick={() => startVideoCall(item)}
                                  className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                                  title="Start Video Call"
                                >
                                  <Video size={16} />
                                </button>
                                <button
                                  onClick={() => onWave(item.id)}
                                  className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                                  title="Send Wave"
                                >
                                  👋
                                </button>
                              </>
                            ) : (
                              <button
                                disabled
                                className="p-2 bg-gray-300 text-gray-600 rounded-full cursor-not-allowed"
                                title="Available after they sign in"
                              >
                                <Video size={16} />
                              </button>
                            )}
                          </div>

                          {/* Remove loved one */}
                          <button
                            onClick={() => removeLovedOne(item.connectionId, item.label)}
                            className="p-2 bg-white text-gray-600 hover:text-red-600 border rounded-full transition-all"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
                    >
                      <UserPlus size={18} />
                      <span className="font-medium">Add Another Loved One</span>
                    </button>
                  </div>
                )}

                {/* Add Loved One Form */}
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                  >
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <UserPlus size={18} className="text-purple-600" />
                      <span>Add Loved One</span>
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Google email address"
                        value={newLovedOneEmail}
                        onChange={(e) => setNewLovedOneEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                      <input
                        type="text"
                        placeholder="Relationship (e.g., Mum, Dad, Guardian)"
                        value={newLovedOneRelationship}
                        onChange={(e) => setNewLovedOneRelationship(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddLovedOne}
                          disabled={isLoading || !newLovedOneEmail || !newLovedOneRelationship}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 font-medium transform hover:scale-105 shadow-lg"
                        >
                          {isLoading ? "Adding..." : "Add"}
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition-all duration-300 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={videoCallState.isOpen}
        onClose={closeVideoCall}
        lovedOneName={videoCallState.lovedOneName}
        lovedOneId={videoCallState.lovedOneId}
        isInitiator={videoCallState.isInitiator}
      />
    </>
  );
};
