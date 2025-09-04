import React, { useEffect, useState } from "react";
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
  onDM: (user: OnlineUser) => void;
  onPing: (user: OnlineUser) => void;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ onDM, onPing }) => {
  const supabase = useSupabaseClient();
  const currentUser = useUser();
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    // Defensive checks for supabase client
    if (!supabase) {
      console.error('Supabase client not available for presence channel');
      return;
    }

    // Initialize channel with defensive checks
    try {
      const newChannel = supabase.channel("lounge-presence", {
        config: { presence: { key: currentUser?.id } },
      });

      if (!newChannel) {
        console.error('Failed to create supabase presence channel');
        return;
      }

      setChannel(newChannel);

      // Track current user presence if available
      if (currentUser) {
        try {
          if (typeof newChannel.track === 'function') {
            newChannel.track({
              id: currentUser.id,
              full_name: currentUser.user_metadata?.full_name || "You",
              year: currentUser.user_metadata?.year || "",
              avatar_url: currentUser.user_metadata?.avatar_url || null,
              status: "online",
            });
          } else {
            console.error('Channel track method not available');
          }
        } catch (error) {
          console.error('Error tracking user presence:', error);
        }
      }

      // Listen to presence sync with defensive checks
      const handleSync = (status: any) => {
        try {
          const allUsers = Object.values(status?.presences || {}).map((arr: any) => arr?.[0]).filter(Boolean);
          setUsers(allUsers.filter((u: OnlineUser) => u?.id && u.id !== currentUser?.id));
        } catch (error) {
          console.error('Error handling presence sync:', error);
        }
      };

      // Subscribe to presence events with defensive checks
      if (typeof newChannel.on === 'function') {
        newChannel.on("presence", { event: "sync" }, handleSync);
      } else {
        console.error('Channel on method not available');
        return;
      }

      // Subscribe to channel
      if (typeof newChannel.subscribe === 'function') {
        const subscription = newChannel.subscribe();
        
        if (!subscription) {
          console.error('Failed to subscribe to presence channel');
        }
      } else {
        console.error('Channel subscribe method not available');
        return;
      }

      return () => {
        // Cleanup with defensive checks
        if (newChannel && typeof newChannel.unsubscribe === 'function') {
          try {
            newChannel.unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing from presence channel:', error);
          }
        }
      };
    } catch (error) {
      console.error('Error setting up presence channel:', error);
    }
  }, [supabase, currentUser]);

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
                onClick={() => onPing(user)}
                aria-label={`Ping ${user.full_name}`}
                className="rounded-full border border-blue-300 hover:bg-blue-100"
                title="Ping for a quick hello"
              >
                🛎️
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDM(user)}
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
