"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSupabaseClient, useUser } from "@/lib/supabase/AuthContext";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ProfilePicturePreview";

interface OnlineUser {
  id: string;
  full_name: string;
  year: string | null;
  avatar_url: string | null;
  status: string; // 'online'
}

interface OnlineUsersProps {
  onDM?: (user: OnlineUser) => void;
  onPing?: (user: OnlineUser) => void;
}

// Helper hook for presence channel management
function usePresenceChannel(
  supabase: ReturnType<typeof useSupabaseClient>,
  channelName: string,
  userPayload: Record<string, any>
) {
  const chRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase) return;
    
    const ch = supabase.channel(channelName, { 
      config: { 
        presence: { key: String(userPayload?.user_id ?? "anon") } 
      } 
    });
    chRef.current = ch;

    const subscribe = async () => {
      try {
        const status = await ch.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Now it's safe to track presence
            ch.track(userPayload).catch((e: any) => console.error("presence.track error", e));
          }
        });
        if (status !== "SUBSCRIBED") console.error("Channel not subscribed:", status);
      } catch (error) {
        console.error("Error subscribing to presence channel:", error);
      }
    };

    subscribe();

    return () => {
      if (ch) {
        ch.untrack().catch(() => {});
        ch.unsubscribe().catch(() => {});
      }
    };
  }, [supabase, channelName, JSON.stringify(userPayload)]);

  return chRef;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ onDM, onPing }) => {
  const supabase = useSupabaseClient();
  const currentUser = useUser();
  const [users, setUsers] = useState<OnlineUser[]>([]);

  // Default handlers if not provided
  const handleDM = onDM || (() => console.log("DM functionality not implemented"));
  const handlePing = onPing || (() => console.log("Ping functionality not implemented"));

  if (!supabase) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-4">Online now</h2>
        <div className="text-red-600 text-sm">Cannot load online users (no backend connection).</div>
      </div>
    );
  }

  const chRef = usePresenceChannel(supabase, "realtime:lounge-presence", {
    user_id: currentUser?.id ?? "anon",
    username: currentUser?.user_metadata?.full_name ?? "Guest",
    full_name: currentUser?.user_metadata?.full_name ?? "Guest",
    year: currentUser?.user_metadata?.year ?? "",
    avatar_url: currentUser?.user_metadata?.avatar_url ?? null,
    status: "online",
  });

  useEffect(() => {
    const ch = chRef.current;
    if (!ch) return;

    // Listen for presence sync
    ch.on("presence", { event: "sync" }, () => {
      try {
        const state = ch.presenceState();
        // Flatten members and filter out current user
        const flat = Object.values(state).flat() as any[];
        const otherUsers = flat.filter((u: OnlineUser) => u?.id && u.id !== currentUser?.id);
        setUsers(otherUsers);
      } catch (error) {
        console.error("Error handling presence sync:", error);
      }
    });

    return () => {
      ch.off("presence", { event: "sync" });
    };
  }, [chRef.current, currentUser?.id]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Online now</h2>
      <ul className="space-y-3">
        {users.length === 0 && (
          <li className="text-gray-400 text-sm">No other students online yet.</li>
        )}
        {users.map((user) => (
          <li className="flex items-center gap-3 bg-white/70 rounded-xl p-2 shadow-sm" key={user.id}>
            <Avatar className="w-8 h-8">
              <AvatarImage alt={user.full_name} src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.full_name.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{user.full_name}</span>
            {user.year && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 ml-1">
                {user.year}
              </span>
            )}
            <span className="ml-auto flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePing(user)}
                aria-label={`Ping ${user.full_name}`}
                className="rounded-full border border-blue-300 hover:bg-blue-100"
                title="Ping for a quick hello"
              >
                🛎️
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDM(user)}
                aria-label={`Start DM with ${user.full_name}`}
                className="rounded-full border border-purple-300 hover:bg-purple-100"
                title="DM"
              >
                💬
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled
                aria-label={`Profile for ${user.full_name}`}
                className="rounded-full border border-gray-300 opacity-50"
                title="View profile (coming soon)"
              >
                🧑‍🎓
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineUsers;