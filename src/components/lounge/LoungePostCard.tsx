// src/components/lounge/LoungePostCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SectionCard from "./SectionCard";

export type LoungePost = {
  id: string;
  author_id: string;
  author_display_name: string | null;
  body: string;
  image_url: string | null;
  audio_url: string | null;
  created_at: string; // ISO
  is_shadow_muted: boolean;
  automod_flag: boolean;
};

type ReactionState = {
  counts: Record<string, number>;
  mine: Record<string, boolean>;
};

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// widen to string[] to avoid Set<"…"> vs string mismatch
const DEFAULT_EMOJIS: string[] = ["👏", "💜", "🔥"];

export default function LoungePostCard({
  post,
  onHidden,
}: {
  post: LoungePost;
  onHidden?: (id: string) => void;
}) {
  const [uid, setUid] = useState<string | null>(null);
  const [rx, setRx] = useState<ReactionState>({ counts: {}, mine: {} });
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isMine = uid === post.author_id;

  // Animate card entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { supabase } = await import("@/lib/supabase-browser");
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUid(data.user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // load reactions for this post
  useEffect(() => {
    let active = true;
    (async () => {
      const { supabase } = await import("@/lib/supabase-browser");
      const { data, error } = await supabase
        .from("lounge_reactions")
        .select("emoji,user_id")
        .eq("post_id", post.id);
      if (error || !data || !active) return;
      const counts: Record<string, number> = {};
      const mine: Record<string, boolean> = {};
      for (const r of data) {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (r.user_id === uid) mine[r.emoji] = true;
      }
      setRx({ counts, mine });
    })();
    return () => {
      active = false;
    };
  }, [post.id, uid]);

  async function toggleReaction(emoji: string) {
    if (!uid) return;
    
    // Animate the reaction
    setAnimatingReaction(emoji);
    setTimeout(() => setAnimatingReaction(null), 600);
    
    const { supabase } = await import("@/lib/supabase-browser");
    const mine = rx.mine[emoji] === true;
    if (mine) {
      await supabase
        .from("lounge_reactions")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", uid)
        .eq("emoji", emoji);
      setRx((cur) => ({
        counts: { ...cur.counts, [emoji]: Math.max((cur.counts[emoji] || 1) - 1, 0) },
        mine: { ...cur.mine, [emoji]: false },
      }));
    } else {
      await supabase
        .from("lounge_reactions")
        .insert({ post_id: post.id, user_id: uid, emoji });
      setRx((cur) => ({
        counts: { ...cur.counts, [emoji]: (cur.counts[emoji] || 0) + 1 },
        mine: { ...cur.mine, [emoji]: true },
      }));
    }
  }

  async function hideMyPost() {
    const { supabase } = await import("@/lib/supabase-browser");
    await supabase.rpc("hide_lounge_post", { p_id: post.id });
    onHidden?.(post.id);
  }

  const reactions = useMemo(() => {
    const used = new Set<string>(DEFAULT_EMOJIS);
    const extras = Object.keys(rx.counts).filter((e) => !used.has(e));
    return [...DEFAULT_EMOJIS, ...extras];
  }, [rx.counts]);

  return (
    <SectionCard className={`overflow-hidden transform transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="flex items-start gap-3 group">
        <div className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
          <span className="text-sm animate-pulse">👩‍⚖️</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link 
              href={`/lounge/profile/${post.author_id}`}
              className="font-semibold hover:text-purple-600 transition-all duration-200 hover:scale-105 hover:bg-purple-50 px-1 py-0.5 rounded relative overflow-hidden group/name"
              title={`View ${post.author_display_name || "Student"}'s profile`}
              aria-label={`View ${post.author_display_name || "Student"}'s profile`}
            >
              <span className="relative z-10">{post.author_display_name || "Student"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 transform scale-x-0 group-hover/name:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
            <span className="text-gray-500 transition-colors duration-200 group-hover:text-gray-700">· {timeAgo(post.created_at)}</span>
            {post.automod_flag && (
              <span
                className="ml-2 text-[10px] rounded-full bg-amber-100 px-2 py-0.5 text-amber-700"
                title="Auto moderation is reviewing this post"
              >
                Under review
              </span>
            )}
            {post.is_shadow_muted && (
              <span
                className="ml-1 text-[10px] rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
                title="Only you can see this until a moderator reviews it"
              >
                Shadow muted
              </span>
            )}
          </div>

          <div className="mt-2 whitespace-pre-wrap text-[15px] leading-6">
            {post.body}
          </div>

          {post.image_url && (
            <div className="mt-3 relative">
              <div className="relative rounded-xl border overflow-hidden bg-gray-100">
                <Image
                  src={post.image_url}
                  alt="Student shared image"
                  width={600}
                  height={400}
                  className="rounded-xl max-h-96 w-auto object-contain transition-opacity duration-300"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyOpUhjpmAhUX7bbNs7UxrZ2Nt1ZHM3/9k="
                />
              </div>
            </div>
          )}

          {post.audio_url && (
            <div className="mt-3">
              <audio controls className="w-full">
                <source src={post.audio_url} />
              </audio>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {reactions.map((e) => {
              const selected = rx.mine[e] === true;
              const count = rx.counts[e] || 0;
              const isAnimating = animatingReaction === e;
              return (
                <button
                  key={e}
                  onClick={() => toggleReaction(e)}
                  className={`group relative rounded-full border px-3 py-2 text-sm leading-none transition-all duration-300 transform hover:scale-110 hover:shadow-lg active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    selected 
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-md" 
                      : "bg-white hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 border-gray-200 hover:border-purple-200"
                  }`}
                  aria-label={`${selected ? 'Remove' : 'Add'} ${e} reaction`}
                  title={`${selected ? 'Remove' : 'Add'} ${e} reaction`}
                  role="button"
                  tabIndex={0}
                >
                  <span className={`mr-1 transition-transform duration-300 ${
                    isAnimating ? 'animate-bounce' : ''
                  } ${selected ? 'animate-pulse' : ''}`}>
                    {e}
                  </span>
                  <span className={`text-xs transition-colors duration-300 ${
                    selected ? 'text-purple-700 font-semibold' : 'text-gray-600 group-hover:text-purple-600'
                  }`}>
                    {count}
                  </span>
                  
                  {/* Animated background on selection */}
                  {selected && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse"></div>
                  )}
                  
                  {/* Ripple effect on click */}
                  {isAnimating && (
                    <div className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-60"></div>
                  )}
                </button>
              );
            })}
          </div>

          {isMine && (
            <div className="mt-3">
              <button
                onClick={hideMyPost}
                className="group inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-all duration-200 transform hover:scale-105"
                aria-label="Delete your post"
                title="Delete your post"
              >
                <span className="group-hover:animate-bounce">🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
