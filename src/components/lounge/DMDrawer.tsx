"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSupabaseClient, useUser } from "@/lib/supabase/AuthContext";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ProfilePicturePreview";
import { Button } from "@/components/ui/Button";

export interface DMUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface DMMessage {
  id: string;
  from_id: string;
  to_id: string;
  body: string;
  created_at: string;
}

export interface DMDrawerProps {
  open?: boolean;
  onClose?: () => void;
  peer?: DMUser | null;
}

// Helper: build a valid DMUser that satisfies the existing DMUser type
function demoPeer(): DMUser {
  return {
    id: "demo-peer",
    full_name: "Guest User",
    avatar_url: null,
  };
}

const DMDrawer: React.FC<DMDrawerProps> = ({
  open = false,
  onClose = () => {},
  peer,
}) => {
  const resolvedPeer = peer ?? demoPeer();
  const supabase = useSupabaseClient();
  const user = useUser();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!user || !resolvedPeer) return;

    setIsLoading(true);
    // Fetch both-ways messages
    supabase
      .from("lounge_dm_messages")
      .select("*")
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .or(`from_id.eq.${resolvedPeer.id},to_id.eq.${resolvedPeer.id}`)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data, error }: { data: any; error: any }) => {
        setIsLoading(false);
        if (error) {
          if (
            error.status === 404 ||
            error.code === "PGRST116" ||
            error.code === "42P01"
          ) {
            setMessages([]);
            return;
          }
          console.error("[DMDrawer] Fetch error:", error);
          return;
        }
        setMessages(data || []);
      });

    // Subscribe for new messages
    const channel = supabase
      .channel("dm-messages-" + user.id + "-" + resolvedPeer.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lounge_dm_messages",
          filter: `from_id=eq.${resolvedPeer.id},to_id=eq.${user.id}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as DMMessage]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, user, resolvedPeer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !resolvedPeer || !user) return;

    const msg: Omit<DMMessage, "id" | "created_at"> = {
      from_id: user.id,
      to_id: resolvedPeer.id,
      body: input.trim(),
    };

    setMessages((prev) => [
      ...prev,
      {
        ...msg,
        id: "tmp" + Date.now(),
        created_at: new Date().toISOString(),
      } as DMMessage,
    ]);
    setInput("");

    const { error } = await supabase.from("lounge_dm_messages").insert([msg]);

    if (error) {
      // Optimistic rollback
      setMessages((prev) => prev.slice(0, -1));
      alert("Failed to send DM: " + error.message);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex justify-end"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="w-full max-w-sm h-full bg-white rounded-l-2xl shadow-2xl flex flex-col pt-4">
        <div className="flex items-center gap-3 px-4 pb-4 border-b">
          <Avatar className="w-10 h-10">
            <AvatarImage
              alt={resolvedPeer.full_name}
              src={resolvedPeer.avatar_url || undefined}
            />
            <AvatarFallback>{resolvedPeer.full_name[0] || "U"}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-lg">
            {resolvedPeer.full_name}
          </span>
          <Button
            aria-label="Close DM"
            className="ml-auto"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            ×
          </Button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50" tabIndex={0}>
          {isLoading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-300 py-12">
              No messages yet. Say hi!
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`
                  flex items-start my-2
                  ${m.from_id === user?.id ? "justify-end" : "justify-start"}
                `}
              >
                <div
                  className={`rounded-2xl max-w-xs px-3 py-2 shadow text-gray-800 ${
                    m.from_id === user?.id
                      ? "bg-gradient-to-br from-blue-100 to-blue-200"
                      : "bg-gradient-to-br from-yellow-100 to-purple-200"
                  }`}
                >
                  {m.body}
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t bg-white p-3 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg border outline-blue-300 focus:ring resize-none min-h-[42px] max-h-[200px] overflow-y-auto"
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey
                ? (e.preventDefault(), sendMessage())
                : undefined
            }
            aria-label="Direct message input"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim()}
            variant="primary"
            aria-label="Send DM"
            className="min-h-[42px]"
          >
            Send
          </Button>
        </div>
      </div>
      <button
        className="fixed inset-0 z-40"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Close overlay"
      />
    </div>
  );
};

export default DMDrawer;
