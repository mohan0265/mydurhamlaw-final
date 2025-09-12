"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Video,
  UserPlus,
  X,
  Users,
  Waves,
  Smile,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { AWYConnection, AWYPresence, AWYNotification } from "@/types/billing";
import { authedFetch } from "@/lib/api/authedFetch";

/** ----------------------------------------------------------------
 * Shared helpers
 * --------------------------------------------------------------- */
async function apiGet<T = any>(url: string): Promise<T> {
  const r = await authedFetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function apiSend<T = any>(url: string, method: string, body?: any): Promise<T> {
  const r = await authedFetch(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

/** ----------------------------------------------------------------
 * CLASSIC compact widget (read-only list + settings link)
 * --------------------------------------------------------------- */
type ClassicConn = {
  id: string;
  email: string;
  display_name?: string | null;
  relationship_label?: string | null;
  status?: string | null;
  connected_user_id?: string | null;
};

function ClassicAWYWidget({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [connections, setConnections] = useState<ClassicConn[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<any>("/api/awy/connections");
      const arr: ClassicConn[] = Array.isArray(data) ? data : data?.connections ?? [];
      setConnections(arr);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Empty state → show a tiny card linking to settings
  if (!loading && connections.length === 0) {
    return (
      <div className="fixed bottom-28 right-6 z-[61] rounded-xl bg-white px-4 py-3 shadow-md border">
        <div className="text-sm mb-1">No loved ones yet.</div>
        <Link href="/settings/awy" className="text-violet-600 underline text-sm">
          Add loved ones
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Floating heart toggle */}
      <button
        aria-label="Always With You"
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-20 right-6 z-[60] h-12 w-12 rounded-full bg-white shadow-md border flex items-center justify-center"
        title="Always With You"
      >
        <span className="text-xl">💗</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 right-6 z-[61] w-[280px] rounded-xl bg-white shadow-xl border">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="font-medium text-sm">Always With You</div>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-black"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[300px] overflow-auto p-3">
            {loading ? (
              <div className="text-sm text-gray-600">Loading…</div>
            ) : (
              <ul className="space-y-2">
                {connections.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {c.display_name || c.relationship_label || "Loved One"}
                      </div>
                      <div className="truncate text-xs text-gray-600">{c.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t p-2 text-right">
            <Link href="/settings/awy" className="text-xs text-violet-600 underline">
              Manage loved ones
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

/** ----------------------------------------------------------------
 * ENHANCED widget (invites, interactions, presence, calls)
 * --------------------------------------------------------------- */

interface EnhancedAWYWidgetProps {
  userId: string;
  className?: string;
}

export const EnhancedAWYWidget: React.FC<EnhancedAWYWidgetProps> = ({
  userId,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connections, setConnections] = useState<AWYConnection[]>([]);
  const [presence, setPresence] = useState<Record<string, AWYPresence>>({});
  const [notifications, setNotifications] = useState<AWYNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Add connection form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnection, setNewConnection] = useState({
    email: "",
    relationship: "",
    displayName: "",
  });

  useEffect(() => {
    if (!userId) return;
    (async () => {
      await Promise.all([fetchConnections(), fetchPresence(), fetchNotifications()]);
      await updateUserPresence();
    })();
    const t = setInterval(fetchPresence, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchConnections = async () => {
    try {
      const data = await apiGet<any>("/api/awy/connections");
      setConnections(Array.isArray(data) ? data : data?.connections || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
      setConnections([]);
    }
  };

  const fetchPresence = async () => {
    try {
      const data = await apiGet<any>("/api/awy/presence");
      setPresence(data?.presence || {});
    } catch (error) {
      console.error("Error fetching presence:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiGet<any>("/api/awy/notifications?unread_only=true");
      setNotifications(data?.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const updateUserPresence = async () => {
    try {
      await apiSend("/api/awy/presence", "POST", {
        is_online: true,
        current_activity: "studying",
        last_seen: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  };

  const handleAddConnection = async () => {
    if (!newConnection.email || !newConnection.relationship) return;
    try {
      // send both naming styles for compatibility
      await apiSend("/api/awy/connections", "POST", {
        email: newConnection.email,
        connectionEmail: newConnection.email,
        relationship: newConnection.relationship,
        relationshipLabel: newConnection.relationship,
        display_name: newConnection.displayName || undefined,
        displayName: newConnection.displayName || undefined,
      });
      setNewConnection({ email: "", relationship: "", displayName: "" });
      setShowAddForm(false);
      fetchConnections();
    } catch (error) {
      console.error("Error adding connection:", error);
    }
  };

  const handleSendInteraction = async (connectionId: string, type: string) => {
    try {
      await apiSend("/api/awy/interactions", "POST", {
        connectionId,
        interactionType: type,
      });
    } catch (error) {
      console.error("Error sending interaction:", error);
    }
  };

  const handleInitiateCall = async (connectionId: string, recipientUserId: string) => {
    try {
      const data = await apiSend<any>("/api/awy/calls", "POST", {
        connectionId,
        recipientUserId,
        sessionType: "video",
      });
      console.log("Call initiated:", data?.sessionId);
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  };

  const getOnlineConnections = () =>
    connections.filter(
      (conn) =>
        conn.status === "active" &&
        conn.connected_user_id &&
        presence[conn.connected_user_id]?.is_online
    );

  const getConnectionDisplayName = (connection: AWYConnection) =>
    connection.display_name || (connection as any).relationship_label;

  const unreadCount = notifications.length;

  if (loading) {
    return (
      <div className={`fixed bottom-20 right-6 z-50 ${className}`}>
        <div className="bg-white rounded-full p-3 shadow-lg border animate-pulse">
          <Heart className="w-6 h-6 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-20 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white rounded-lg shadow-xl border mb-4 w-80 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <h3 className="font-semibold text-gray-900">Always With You</h3>
                </div>
                <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {unreadCount > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {/* Online Connections */}
              {getOnlineConnections().length > 0 && (
                <div className="p-4 border-b">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Online Now ({getOnlineConnections().length})
                  </h4>
                  <div className="space-y-2">
                    {getOnlineConnections().map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm font-medium">
                            {getConnectionDisplayName(connection)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSendInteraction(connection.id, "wave")}
                            className="p-1 hover:bg-green-100 rounded"
                            title="Send wave"
                          >
                            <Waves className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => handleSendInteraction(connection.id, "heart")}
                            className="p-1 hover:bg-pink-100 rounded"
                            title="Send love"
                          >
                            <Heart className="w-4 h-4 text-pink-600" />
                          </button>
                          {(connection as any)?.permissions?.can_initiate_calls && connection.connected_user_id && (
                            <button
                              onClick={() =>
                                handleInitiateCall(connection.id, connection.connected_user_id!)
                              }
                              className="p-1 hover:bg-blue-100 rounded"
                              title="Video call"
                            >
                              <Video className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Connections */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Connections ({connections.length})
                  </h4>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Add connection"
                  >
                    <UserPlus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {connections.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No connections yet</p>
                    <Link href="/settings/awy" className="text-violet-600 underline text-sm">
                      Add loved ones in Settings
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connections.map((connection) => {
                      const isOnline =
                        connection.connected_user_id &&
                        presence[connection.connected_user_id]?.is_online;

                      return (
                        <div
                          key={connection.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                connection.status === "pending"
                                  ? "bg-yellow-500"
                                  : isOnline
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            />
                            <span className="text-sm">
                              {getConnectionDisplayName(connection)}
                            </span>
                            {connection.status === "pending" && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>

                          {connection.status === "active" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleSendInteraction(connection.id, "thinking_of_you")
                                }
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Thinking of you"
                              >
                                <Smile className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Connection Form (enhanced mode) */}
              {showAddForm && (
                <div className="p-4 border-t bg-gray-50">
                  <h4 className="text-sm font-medium mb-3">Add New Connection</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Email address"
                      value={newConnection.email}
                      onChange={(e) =>
                        setNewConnection((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Relationship (e.g., Mum, Dad, Partner)"
                      value={newConnection.relationship}
                      onChange={(e) =>
                        setNewConnection((prev) => ({ ...prev, relationship: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Display name (optional)"
                      value={newConnection.displayName}
                      onChange={(e) =>
                        setNewConnection((prev) => ({ ...prev, displayName: e.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddConnection}
                        size="sm"
                        className="flex-1"
                        disabled={!newConnection.email || !newConnection.relationship}
                      >
                        Send Invitation
                      </Button>
                      <Button onClick={() => setShowAddForm(false)} size="sm" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setIsExpanded((s) => !s)}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AWY"
      >
        <Heart className="w-6 h-6" />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}

        {/* Online Indicator */}
        {getOnlineConnections().length > 0 && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {getOnlineConnections().length}
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
};

/** ----------------------------------------------------------------
 * Default export selects UI by env flag (classic by default)
 * --------------------------------------------------------------- */
const UI_MODE = process.env.NEXT_PUBLIC_AWY_UI_MODE ?? "classic";

export default function AWYWidget({ userId }: { userId: string }) {
  if (UI_MODE === "enhanced") {
    return <EnhancedAWYWidget userId={userId} />;
  }
  return <ClassicAWYWidget userId={userId} />;
}

// Optional named exports (handy for tests or direct imports)
export { ClassicAWYWidget };
export { EnhancedAWYWidget as AWYWidgetEnhanced };
