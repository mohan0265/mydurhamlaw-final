// src/components/lounge/LoungeFeed.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import EmptyState from "./EmptyState";
import LoungePostCard, { LoungePost } from "./LoungePostCard";

interface LoungeFeedProps {
  refreshKey?: number;
}

export default function LoungeFeed({ refreshKey }: LoungeFeedProps) {
  const [posts, setPosts] = useState<LoungePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const page = await fetchPage(20, null);
        if (!mounted) return;
        setPosts(page.rows);
        setCursor(page.nextCursor ?? null);
        setHasMore(page.rows.length > 0 && !!page.nextCursor);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load posts");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  // realtime updates
  useEffect(() => {
    let channel: any;
    
    (async () => {
      const { supabase } = await import("@/lib/supabase-browser");
      
      channel = supabase
        .channel("lounge_posts_rt")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "lounge_posts" },
          () => refreshFirstPage()
        )
        .subscribe();
    })();

    return () => {
      if (channel) {
        (async () => {
          const { supabase } = await import("@/lib/supabase-browser");
          supabase.removeChannel(channel);
        })();
      }
    };
  }, []);

  async function refreshFirstPage() {
    try {
      const page = await fetchPage(20, null);
      setPosts(page.rows);
      setCursor(page.nextCursor ?? null);
      setHasMore(page.rows.length > 0 && !!page.nextCursor);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to refresh posts");
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMoreRef.current || loadingMore) return;
    
    try {
      setLoadingMore(true);
      loadingMoreRef.current = true;
      const page = await fetchPage(20, cursor);
      setPosts((cur) => [...cur, ...page.rows]);
      setCursor(page.nextCursor ?? null);
      setHasMore(page.rows.length > 0 && !!page.nextCursor);
    } catch (err: any) {
      setError(err.message || "Failed to load more posts");
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }

  function onHidden(id: string) {
    setPosts((cur) => cur.filter((p) => p.id !== id));
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border bg-white/70 shadow-sm p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state - Special handling for RPC function missing
  if (error && posts.length === 0) {
    const isRpcError = error.includes('get_lounge_posts_page') || error.includes('function') || error.includes('schema cache');
    
    return (
      <div className="rounded-2xl border bg-white/70 shadow-sm p-8 text-center">
        <div className="text-red-500 text-lg mb-2">😔</div>
        <h3 className="font-semibold text-gray-900 mb-2">
          {isRpcError ? "Database function needs updating" : "Something went wrong"}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {isRpcError 
            ? "The database functions need to be updated. Please run the migration script or contact support."
            : error
          }
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                const page = await fetchPage(20, null);
                setPosts(page.rows);
                setCursor(page.nextCursor ?? null);
                setHasMore(page.rows.length > 0 && !!page.nextCursor);
              } catch (err: any) {
                setError(err.message || "Failed to load posts");
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
          {isRpcError && (
            <button
              onClick={() => window.location.href = '/support'}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
            >
              Get Help
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <EmptyState
        title="Your Lounge awaits your first post"
        note="Be the first to share something wonderful! Your fellow students are excited to hear from you. 💜"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner for partial errors */}
      {error && posts.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Posts with staggered fade-in animation */}
      {posts.map((p, index) => (
        <div
          key={p.id}
          className="opacity-0 animate-fade-in"
          style={{
            animationDelay: `${Math.min(index * 100, 500)}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <LoungePostCard post={p} onHidden={onHidden} />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-xl border border-purple-200 bg-white hover:bg-purple-50 px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                Loading older posts...
              </>
            ) : (
              <>
                <span>📜</span>
                Load older posts
              </>
            )}
          </button>
        </div>
      )}

      {/* End of posts message */}
      {!hasMore && posts.length > 5 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
            <span>✨</span>
            <span>You&apos;ve reached the beginning of our community story</span>
            <span>✨</span>
          </div>
        </div>
      )}
    </div>
  );
}

async function fetchPage(limit: number, cursor: string | null) {
  const { supabase } = await import("@/lib/supabase-browser");
  const { data, error } = await supabase.rpc("get_lounge_posts_page", {
    p_limit: limit,
    p_cursor: cursor,
  });
  if (error) throw error;
  const rows = (data || []) as LoungePost[];
  const nextCursor =
    rows.length > 0 ? rows[rows.length - 1]?.created_at : null;
  return { rows, nextCursor };
}
