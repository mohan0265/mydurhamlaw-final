import React, { useEffect, useState, useRef } from "react";
import { useSupabaseClient, useUser } from "@/lib/supabase/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ProfilePicturePreview";
import { Button } from "@/components/ui/Button";

interface DMUser {
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

interface DMDrawerProps {
  open: boolean;
  onClose: () => void;
  peer: DMUser | null;
}

const DMDrawer: React.FC<DMDrawerProps> = ({ open, onClose, peer }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !peer) return;

    setIsLoading(true);
    // Fetch both-ways messages
    supabase
      .from("lounge_dm_messages")
      .select("*")
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .or(`from_id.eq.${peer.id},to_id.eq.${peer.id}`)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        setIsLoading(false);
        setMessages(data || []);
      });

    // Subscribe for new messages
    const channel = supabase
      .channel("dm-messages-" + user.id + "-" + peer.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "lounge_dm_messages",
        filter: `from_id=eq.${peer.id},to_id=eq.${user.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as DMMessage]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, user, peer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !peer || !user) return;

    const msg: Omit<DMMessage, "id" | "created_at"> = {
      from_id: user.id,
      to_id: peer.id,
      body: input.trim(),
    };

    setMessages((prev) => [...prev, { ...msg, id: "tmp" + Date.now(), created_at: new Date().toISOString() } as DMMessage]);
    setInput("");

    const { error } = await supabase
      .from("lounge_dm_messages")
      .insert([msg]);

    if (error) {
      // Optimistic rollback
      setMessages((prev) => prev.slice(0, -1));
      alert("Failed to send DM: " + error.message);
    }
  };

  if (!open || !peer) return null;

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
            <AvatarImage alt={peer.full_name} src={peer.avatar_url || undefined} />
            <AvatarFallback>
              {peer.full_name[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-lg">{peer.full_name}</span>
          <Button aria-label="Close DM" className="ml-auto" onClick={onClose} size="sm" variant="ghost">
            ×
          </Button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50" tabIndex={0}>
          {isLoading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-300 py-12">No messages yet. Say hi!</div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`
                  flex items-start my-2
                  ${m.from_id === user?.id ? "justify-end" : "justify-start"}
                `}
              >
                <div className={`rounded-2xl max-w-xs px-3 py-2 shadow text-gray-800 ${
                  m.from_id === user?.id ? "bg-gradient-to-br from-blue-100 to-blue-200" : "bg-gradient-to-br from-yellow-100 to-purple-200"
                }`}>
                  {m.body}
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t bg-white p-3 flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded-lg border outline-blue-300 focus:ring"
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={e => (e.key === "Enter" && !e.shiftKey) ? (e.preventDefault(), sendMessage()) : undefined}
            aria-label="Direct message input"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim()}
            variant="primary"
            aria-label="Send DM"
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
