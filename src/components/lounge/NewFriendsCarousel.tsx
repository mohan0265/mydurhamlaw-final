import React, { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface LoungeJoiner {
  id?: string;
  user_id?: string;
  display_name: string;
  avatar_url?: string;
  joined_at?: string;
  created_at?: string;
}

const NewFriendsCarousel: React.FC = () => {
  const [joiners, setJoiners] = useState<LoungeJoiner[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent joiners
  useEffect(() => {
    fetchRecentJoiners();
    
    // Set up real-time subscription for new joiners
    const subscription = supabase
      .channel('lounge_joiners_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lounge_joiners'
        },
        (payload) => {
          console.log('New joiner change received:', payload);
          fetchRecentJoiners(); // Refresh the list
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRecentJoiners = async () => {
    try {
      const { data, error } = await supabase
        .from('lounge_joiners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6); // Show max 6 recent joiners

      if (error) {
        console.error('Error fetching recent joiners:', error);
        return;
      }

      setJoiners(data || []);
    } catch (error) {
      console.error('Error fetching recent joiners:', error);
    } finally {
      setLoading(false);
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

  // Fallback data when no joiners are available or during loading
  const fallbackJoiners = [
    { id: "fallback1", display_name: "Orla", avatar_url: null, created_at: new Date(Date.now() - 60000).toISOString() },
    { id: "fallback2", display_name: "Sam", avatar_url: null, created_at: new Date(Date.now() - 180000).toISOString() },
    { id: "fallback3", display_name: "Riya", avatar_url: null, created_at: new Date(Date.now() - 420000).toISOString() },
  ];

  const displayJoiners = loading ? fallbackJoiners : (joiners.length > 0 ? joiners : fallbackJoiners);

  return (
    <div className="bg-gradient-to-br from-violet-100 via-blue-100 to-sky-100 rounded-2xl shadow px-4 py-3 mb-4">
      <h3 className="font-bold text-lg mb-1">
        🌟 New Faces
        {!loading && joiners.length > 0 && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({joiners.length} recent)
          </span>
        )}
      </h3>
      
      {loading ? (
        <div className="text-sm text-gray-500 py-2">Loading recent joiners...</div>
      ) : joiners.length === 0 ? (
        <div className="text-sm text-gray-500 py-2">
          No recent joiners. Here are some example faces to get started!
        </div>
      ) : null}
      
      <div className="flex gap-4 overflow-x-auto py-1">
        {displayJoiners.map((user, index) => (
          <div 
            key={user.id || `joiner-${index}`} 
            className="flex flex-col items-center min-w-[80px] flex-shrink-0"
          >
            <Avatar className="w-10 h-10 shadow border border-blue-200">
              <AvatarImage 
                src={user.avatar_url || undefined} 
                alt={user.display_name}
              />
              <AvatarFallback className="bg-violet-200 text-violet-800">
                {user.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-xs mt-1 text-center">
              {user.display_name}
            </span>
            <span className="text-[10px] text-gray-400">
              {user.created_at ? formatTimeAgo(user.created_at) : 'recently'}
            </span>
          </div>
        ))}
      </div>
      
      {joiners.length === 0 && !loading && (
        <div className="text-xs text-gray-400 mt-2">
          👋 Be the first to say hello!
        </div>
      )}
    </div>
  );
};

export default NewFriendsCarousel;
