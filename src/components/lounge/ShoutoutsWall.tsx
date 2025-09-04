"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useSupabaseClient, useUser } from "@/lib/supabase/AuthContext";

interface Shoutout {
  id?: string;
  user_id?: string;
  display_name: string;
  message: string;
  created_at?: string;
}

const ShoutoutsWall: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fallback UI when supabase context is missing
  if (!supabase) {
    return (
      <div className="bg-gradient-to-br from-red-100 via-orange-100 to-red-50 rounded-2xl shadow px-4 py-3 mb-4">
        <h3 className="font-bold text-lg mb-1">👏 Shoutouts Wall</h3>
        <div className="text-center text-red-600 text-sm py-4">
          Unable to load shoutouts (no backend connection). Please refresh the page.
        </div>
      </div>
    );
  }

  // Fetch initial shoutouts
  useEffect(() => {
    fetchShoutouts();
    
    // Set up real-time subscription
    const channel = supabase.channel('realtime:lounge-shoutouts');
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lounge_shoutouts'
        },
        (payload) => {
          console.log('Shoutouts change received:', payload);
          fetchShoutouts(); // Refresh the list
        }
      )
      .subscribe();
      
    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  const fetchShoutouts = async () => {
    try {
      const { data, error } = await supabase
        .from('lounge_shoutouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching shoutouts:', error);
        return;
      }

      setShoutouts(data || []);
    } catch (error) {
      console.error('Error fetching shoutouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!msg.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lounge_shoutouts')
        .insert([
          {
            display_name: user?.user_metadata?.full_name || 'Anonymous',
            message: msg.trim(),
            user_id: user?.id || null
          }
        ]);

      if (error) {
        console.error('Error sending shoutout:', error);
        return;
      }

      setMsg("");
    } catch (error) {
      console.error('Error sending shoutout:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-100 via-green-100 to-green-50 rounded-2xl shadow px-4 py-3 mb-4">
      <h3 className="font-bold text-lg mb-1">👏 Shoutouts Wall</h3>
      <input
        type="text"
        className="w-full rounded-lg p-2 border border-gray-200 mb-2 text-sm"
        value={msg}
        placeholder="Give kudos to a friend, teacher, or random act…"
        onChange={e => setMsg(e.target.value)}
        onKeyDown={e => (e.key === "Enter" ? (e.preventDefault(), send()) : undefined)}
        disabled={submitting}
        aria-label="Shoutout message"
      />
      <Button 
        className="mb-2" 
        disabled={!msg.trim() || submitting} 
        onClick={send} 
        size="sm"
      >
        {submitting ? 'Sending...' : 'Send'}
      </Button>
      
      {loading ? (
        <div className="text-center text-gray-500 text-sm py-4">Loading shoutouts...</div>
      ) : (
        <ul className="max-h-32 overflow-y-auto flex flex-col gap-1 text-[13px]">
          {shoutouts.length === 0 ? (
            <li className="text-gray-500 text-center py-2">No shoutouts yet. Be the first to share some kudos!</li>
          ) : (
            shoutouts.map((s) => (
              <li key={s.id || Math.random()}>
                {s.display_name}: {s.message} 
                <span className="text-gray-400 text-[11px]">
                  ({s.created_at ? formatTimeAgo(s.created_at) : 'unknown'})
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ShoutoutsWall;